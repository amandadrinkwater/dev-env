module.exports = {

    /*
      * FlashBotsUniswapQuery - UNISWAP_LOOKUP_CONTRACT_ADDRESS
            0x5ef1009b9fcd4fec3094a5564047e190d72bd511
            0xf522b378273394bea84a31db3d627c9a6fd522f0
            0xeb8583a930fef77775535025438703bd0b331bd6 
      * 
	 */

    FlashBotsUniswapQuery: { 

        address: "0xeb8583a930fef77775535025438703bd0b331bd6", 
        
        ABI : [
                {
                    "inputs": [
                    { "internalType": "contract UniswapV2Factory", "name": "_uniswapFactory", "type": "address" },
                    { "internalType": "uint256", "name": "_start", "type": "uint256" },
                    { "internalType": "uint256", "name": "_stop", "type": "uint256" }
                    ],
                    "name": "getPairsByIndexRange",
                    "outputs": [
                    { "internalType": "address[3][]", "name": "", "type": "address[3][]" }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [
                    { "internalType": "contract IUniswapV2Pair[]", "name": "_pairs", "type": "address[]" }
                    ],
                    "name": "getReservesByPairs",
                    "outputs": [
                    { "internalType": "uint256[3][]", "name": "", "type": "uint256[3][]" }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                }
                ]
    }, 
    
    FlashBotsMultiCallFL : { 

        address: "0xAaBcFE801e4C9086F3E72e4920EFb381965c854b", 
        ABI : ""
    }, 

}
