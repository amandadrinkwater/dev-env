module.exports = {
  ERC20: [
    

    // Basic Functions
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount) returns (bool)", // Added mint function for testing
  'function name() view returns (string)',
    'function symbol() view returns (string)',
    "function decimals() view returns (uint8)",
    'function totalSupply() view returns (uint256)',
  
  // Balance and transfers
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
  ],

  WETH_ABI: [
    "function deposit() payable",
    "function withdraw(uint256)",
    "function balanceOf(address) view returns (uint256)"
  ],

  UNIV2_PAIR: [
     // Read functions
  "function name() external pure returns (string memory)",
  "function symbol() external pure returns (string memory)",
  "function decimals() external pure returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  
  // Pair-specific functions
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function price0CumulativeLast() external view returns (uint256)",
  "function price1CumulativeLast() external view returns (uint256)",
  "function kLast() external view returns (uint256)",
  
  // Write functions
  "function approve(address spender, uint256 value) external returns (bool)",
  "function transfer(address to, uint256 value) external returns (bool)",
  "function transferFrom(address from, address to, uint256 value) external returns (bool)",
  
  // Mint/Burn functions
  "function mint(address to) external returns (uint256 liquidity)",
  "function burn(address to) external returns (uint256 amount0, uint256 amount1)",
  "function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external",
  "function skim(address to) external",
  "function sync() external",
  
  // Initialization
  "function initialize(address, address) external",
  
  // Events
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Mint(address indexed sender, uint256 amount0, uint256 amount1)",
  "event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)",
  "event Swap( address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
  "event Sync(uint112 reserve0, uint112 reserve1)"

  ],
  
  UNIV2_FACTORY: [
    "function getPair(address tokenA, address tokenB) external view returns (address pair)"
  ],
  
  UNIV2_ROUTER: [
     "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)",
  "function factory() view returns (address)"
  ],
  // --- NEW: Uniswap V3 QuoterV2 (struct input; returns amountOut, sqrtPriceAfter, ticksCrossed, gasEstimate)
  UNIV3_QUOTER_V2: [
    "function quoteExactInputSingle(tuple(address tokenIn,address tokenOut,uint24 fee,uint256 amountIn,uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160, uint32, uint256)",
    // Optional path-based quoting:
    "function quoteExactInput(bytes path,uint256 amountIn) external returns (uint256 amountOut)"
  ]
};
