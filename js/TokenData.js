var tokenData = 
[
    // Mainnet
    {
        name: "PRX",
        address: "0x71238884764fc000e35456e285d888080dbef2b0",
        symbol: "18",
        chain: "56"
    },
    {
        name: "BNB",
        address: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
        symbol: "18",
        chain: "56"
    },
    {
        name: "USDT",
        address: "0x55d398326f99059ff775485246999027b3197955",
        symbol: "18",
        chain: "56"
    },

    // Testnet
    {
        name: "PRX",
        address: "0x579a42aaf266a73dff0182ec3e76b7c28c15db83",
        symbol: "18",
        chain: "97"
    },
    {
        name: "BNB",
        address: "0xae13d989dac2f0debff460ac112a837c89baa7cd",
        symbol: "18",
        chain: "97"
    },
    {
        name: "USDT",
        address: "0xc06073Aa93C99163105Ba28cC8d7B3c5c0C522e5",
        symbol: "18",
        chain: "97"
    }
];

let dropdown = $('#token');

dropdown.empty();
tokenData.forEach(element => {
    if (testMode) {
        if (element.chain == "97") {
            dropdown.append(`<option data-subtext="${element.address}">${element.name}</option>`);
        }
    }
    else {
        if (element.chain == "56") {
            dropdown.append(`<option data-subtext="${element.address}">${element.name}</option>`);
        }
    }
});
dropdown.prop('selectedIndex', 0);