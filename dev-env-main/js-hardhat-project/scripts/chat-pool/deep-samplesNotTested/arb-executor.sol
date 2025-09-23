// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*

Notes:

The contract is educational: amountOutMin is set to 1 (unsafe). 
In production you must compute amounts with router.getAmountsOut() and enforce slippage tolerances.

This contract assumes the contract will own intermediate tokens 
inside itself so swaps can be chained.

Important safety & usage notes for the smart-contract approach

The contract example is deliberately simplified. It uses amountOutMin = 1 inside the contract — this is unsafe. Before using on any real network:

compute getAmountsOut(amountIn, path) and apply a slippage tolerance in the contract call or pre-calc in the script and pass min amounts in.

add reentrancy guards (e.g., Checks-Effects-Interactions or use OpenZeppelin ReentrancyGuard).

check allowances carefully and avoid open approvals.

The contract holds intermediate tokens during execution — make sure rescue functions and access control are correct.

Test thoroughly on a forked mainnet and simulate adverse pricing and slippage.

Quick checklist for you to run these:

Put multihop-swap.js and combined-routing.js under scripts/.

Put ArbitrageExecutor.sol in contracts/.

Put deploy & run scripts in scripts/ and set the deployed address in run-arb-example.js.

Start Hardhat mainnet fork (e.g., npx hardhat node --fork <RPC_URL>@<block>) or use npx hardhat node with FORK config.

Run npx hardhat run --network localhost scripts/deploy-arb-exec.js to deploy contract.

Update run-arb-example.js with the deployed address, then run it.

If you want, I can:

Replace the unsafe amountOutMin = 1 design with a safe flow where the script computes getAmountsOut and passes minimums into the contract (more secure).

Add slippage parameters so the caller controls acceptable slippage.

Harden the Solidity contract (reentrancy guard, ownership pattern via OpenZeppelin, events, gas optimizations).

Convert scripts to TypeScript.

Which of the above improvements would you like next?

*/

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from,address to,uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

interface IUniswapV2Router {
    function WETH() external pure returns (address);
    function swapExactTokensForTokens(
        uint amountIn, 
        uint amountOutMin, 
        address[] calldata path, 
        address to, 
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
}

contract ArbitrageExecutor {
    address public owner;
    IUniswapV2Router public router;

    event Executed(address indexed caller, uint256 profit);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    constructor(address _router) {
        owner = msg.sender;
        router = IUniswapV2Router(_router);
    }

    // Allow owner to change router if needed
    function setRouter(address _router) external onlyOwner {
        router = IUniswapV2Router(_router);
    }

    /**
     * @notice Execute chained swaps inside the contract.
     * - Caller must have approved this contract to spend tokenIn before calling.
     * - _flow is an array of steps. Each step is a path for router.swapExactTokensForTokens.
     * - amountsIn is the amount provided to the first step (for subsequent steps, the contract uses
     *   contract's current token balance of the step input token).
     *
     * For simplicity, all steps use amountExactIn semantics (swapExactTokensForTokens).
     */
    function executeChainedSwaps(address[] calldata tokensInOrder, uint256 amountIn, address[][] calldata paths, uint256 deadline) external {
        require(paths.length > 0, "no steps");

        // Pull input tokens from caller into contract (first token in tokensInOrder)
        address firstToken = tokensInOrder[0];
        require(IERC20(firstToken).transferFrom(msg.sender, address(this), amountIn), "transferFrom failed");

        uint256 currentAmount = amountIn;

        for (uint i = 0; i < paths.length; i++) {
            address[] calldata path = paths[i];
            require(path.length >= 2, "invalid path");

            address tokenInput = path[0];
            address tokenOutput = path[path.length - 1];

            // Approve router to spend input tokens if needed
            IERC20(tokenInput).approve(address(router), currentAmount);

            // amountOutMin set to 1 for demo. In production compute via getAmountsOut and apply slippage tolerance.
            uint amountOutMin = 1;

            // Perform swap; send tokens to THIS contract so it can continue chaining
            router.swapExactTokensForTokens(currentAmount, amountOutMin, path, address(this), deadline);

            // After swap, set currentAmount = balance of tokenOutput in this contract
            currentAmount = IERC20(tokenOutput).balanceOf(address(this));
        }

        // After all steps, send final tokens back to caller (profit can be > supplied amount)
        address finalToken = tokensInOrder[tokensInOrder.length - 1]; // convenience: caller may provide mapping
        uint256 finalBal = IERC20(finalToken).balanceOf(address(this));
        if (finalBal > 0) {
            IERC20(finalToken).transfer(msg.sender, finalBal);
        }

        emit Executed(msg.sender, finalBal);
    }

    // allow owner to rescue tokens
    function rescueToken(address token, uint256 amount, address to) external onlyOwner {
        IERC20(token).transfer(to, amount);
    }
}
