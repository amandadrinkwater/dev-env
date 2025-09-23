// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";

contract UniswapV2Flashswap is IUniswapV2Callee {
    address public immutable router;

    event FlashswapExecuted(address indexed tokenBorrow, uint256 amount, address[] path);

    constructor(address _router) {
        router = _router;
    }

    function startFlashswap(
        address pairAddress,
        address tokenBorrow,
        uint amount,
        address[] calldata path,
        uint slippageBps
    ) external {
        IUniswapV2Pair pair = IUniswapV2Pair(pairAddress);

        address token0 = pair.token0();
        address token1 = pair.token1();

        require(tokenBorrow == token0 || tokenBorrow == token1, "Invalid borrow token");

        // decide which token to borrow
        uint amount0Out = tokenBorrow == token0 ? amount : 0;
        uint amount1Out = tokenBorrow == token1 ? amount : 0;

        // trigger flashswap → calls uniswapV2Call()
        pair.swap(amount0Out, amount1Out, address(this), abi.encode(path, slippageBps));
    }

    function uniswapV2Call(
        address sender,
        uint amount0,
        uint amount1,
        bytes calldata data
    ) external override {
        (address[] memory path, uint slippageBps) = abi.decode(data, (address[], uint));

        uint amountBorrowed = amount0 > 0 ? amount0 : amount1;
        address tokenBorrow = path[0];
        address tokenPayback = path[path.length - 1];

        // Approve router to use borrowed funds
        IERC20(tokenBorrow).approve(router, amountBorrowed);

        // Perform the swap(s)
        uint deadline = block.timestamp + 300; // 5 mins
        uint[] memory amountsOut = IUniswapV2Router02(router).getAmountsOut(amountBorrowed, path);

        // calculate min out with slippage tolerance
        uint amountOutMin = (amountsOut[amountsOut.length - 1] * (10000 - slippageBps)) / 10000;

        IUniswapV2Router02(router).swapExactTokensForTokens(
            amountBorrowed,
            amountOutMin,
            path,
            address(this),
            deadline
        );

        // Repay borrowed tokens
        uint repayAmount = (amountBorrowed * 1000) / 997 + 1; // Uniswap 0.3% fee
        IERC20(tokenPayback).transfer(msg.sender, repayAmount);

        emit FlashswapExecuted(tokenBorrow, amountBorrowed, path);
    }
}
