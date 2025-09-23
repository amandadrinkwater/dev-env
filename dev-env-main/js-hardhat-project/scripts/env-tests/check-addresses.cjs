


// code Ok, make it to transverse all addresses

const { ethers } = require("ethers");
const addresses = require("../utils/addresses.cjs");


console.log("Check Router:", addresses.ROUTERS.UNIV2, ethers.isAddress(addresses.ROUTERS.UNIV2));
console.log("Check WETH Whale:", addresses.WHALES.WETH, ethers.isAddress(addresses.WHALES.WETH));


/*

👉 If any prints false, we retype that address cleanly.


*/
