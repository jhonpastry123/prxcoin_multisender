const Web3Modal = window.Web3Modal.default;
const walletConnectProvider = window.WalletConnectProvider.default;

const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;

var myBalance = 0;

var pubChainId = 0;
var initInterval;

var strConnectWallet = "<i class=\"fas fa-wallet pr-1\"></i>Connect Wallet";
var strDisconnectWallet = "<i class=\"fas fa-sign-out-alt\"></i>Disconnect Wallet";

const maxUint256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
var txID = "";
const minSwapAmount = 100;

var marketingFee = 0.01;

var bnbPrice = 0;
var etherPrice = 0;

var isMobile = false;
var isBNB = false;

var totalAmount = 0.21;

var current_fs, next_fs, previous_fs; //fieldsets
var left, opacity, scale; //fieldset properties which we will animate
var animating; //flag to prevent quick multi-click glitches

var token = "";
var token_address = "";
var address_arr = [];
var cost = 0;


var web3_other;
var web3BaseUrl_main;
var multiSenderContract_other;



window.addEventListener('load', async () => {

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // true for mobile device
        isMobile = false;
    } else {
        isMobile = false;
        // false for not mobile device
    }

    init();
});

async function onConnect() {
    try {
        provider = await web3Modal.connect();

        $("#btn-connect-wallet").addClass("disabled");
        $("#btn-connect-wallet").html("<i class='fas fa-sync-alt'></i>SWAP");

        disableConnectWalletButton();

        fetchAccountData();

    } catch (e) {
        console.log("Could not get a wallet connection", e);
        return;
    }

    // Subscribe to accounts change
    provider.on("accountsChanged", (accounts) => {
        fetchAccountData();
    });

    // Subscribe to chainId change
    provider.on("chainChanged", (chainId) => {
        fetchAccountData();
    });
}

function disableConnectWalletButton() {
    $("#btn-connect-wallet").addClass("disabled");
    $("#btn-connect-wallet").html("<i class='fas fa-sync-alt'></i>SWAP");
    $(".connect-wallet").addClass("no-event");
    $(".connect-wallet").html("<i class='fas fa-spinner'></i> Connecting");
}


async function onDisconnect() {

    selectedAccount = null;
    pubChainId = 0;

    jQuery(".connect-wallet").html(strConnectWallet);
    jQuery(".connect-wallet").removeClass('no-event');

    if (provider) {
        try {
            await provider.disconnect();
        } catch (e) {

        }
        provider = null;
        await web3Modal.clearCachedProvider();
    }

}

// fetch data
async function fetchAccountData() {

    web3 = new Web3(provider);

    const chainId = await web3.eth.getChainId();
    const accounts = await web3.eth.getAccounts();

    selectedAccount = accounts[0];
    pubChainId = chainId;

    if (chainId != 56 && chainId != 97) {
        onDisconnect();
        Swal.fire({
            icon: 'error',
            title: 'Wrong network',
            text: 'Change network to Binance Smart Chain network'
        })

        return false;
    }

    if (chainId == 56 && testMode) {
        onDisconnect();

        Swal.fire({
            icon: 'error',
            title: 'Wrong network',
            text: 'Change network to Binance Test Network'
        })

        return false;
    } else if (chainId == 97 && !testMode) {
        onDisconnect();

        Swal.fire({
            icon: 'error',
            title: 'Wrong network',
            text: 'Change network to Binance Main Network'
        })

        return false;
    } else if (provider != null) {

        jQuery(".connect-wallet").html("<i class=\"fas fa-wallet pr-1\"></i>" + selectedAccount.substr(0, 7) + "..." + selectedAccount.substr(selectedAccount.length - 4, selectedAccount.length));
        jQuery(".connect-wallet").removeClass("no-event");

        // Call Multi Sender Contract
        web3BaseUrl_main = testMode ? 'https://speedy-nodes-nyc.moralis.io/28eb04c22a0f92b22765e175/bsc/testnet' : 'https://speedy-nodes-nyc.moralis.io/28eb04c22a0f92b22765e175/bsc/mainnet';
        web3_other = new Web3(new Web3.providers.HttpProvider(web3BaseUrl_main));
        multiSenderContract_other = new web3_other.eth.Contract(multiSenderAbi, multiSenderAddress);
        marketingFee = await multiSenderContract_other.methods.marketingFee().call();

        // MultiSenderContract for web3
        multiSenderContract = new web3.eth.Contract(multiSenderAbi, multiSenderAddress);

        

    }
}

function init() {

    const providerOptions = {
        walletconnect: {
            package: walletConnectProvider,
            options: {
                // Mikko's test key - don't copy as your mileage may vary
                infuraId: "8043bb2cf99347b1bfadfb233c5325c0",
            }
        },

        fortmatic: {
            package: Fortmatic,
            options: {
                // Mikko's TESTNET api key
                key: "pk_test_391E26A3B43A3350"
            }
        }
    };

    web3Modal = new Web3Modal({
        cacheProvider: false, // optional
        providerOptions // required
    });

}




$(document).tooltip({
    items: "#tooltip",
    content: "Please ignore this if your token isn't deflationary. <br>Most tokens are not, so leave it as is.<br>If your token has deflationary functions, such as token dividends, burning, taxes, etc., please enable this! <br> If you are the token owner and there is an automatic LP function and you have not added a liquidity pool, please turn off the automatic LP first!",
    track: true
});

async function getDataInfo() {
    if (provider) {
        fetchAccountData();
    }
}

jQuery(document).ready(function () {
    jQuery(".connect-wallet").on("click", function () {
        if (provider) {
            showWalletModal();
        } else {
            onConnect();
        }
    });

});

// Get BNB Amount
async function getBalance() {
    var result = await web3_other.eth.getBalance(selectedAccount);
    return result;
}

// Get Token Balance
async function getTokenBalance() {
    var tokenContract = new web3_other.eth.Contract(erc20Abi, token_address);
    var result = await tokenContract.methods.balanceOf(selectedAccount).call();
    return result;
}

// Approve Token
async function approve() {

    var tokenContract = new web3.eth.Contract(erc20Abi, token_address);
    try {
        await tokenContract.methods.approve(multiSenderAddress, maxUint256).send({ from: selectedAccount });
        return true;
    } catch (Exception) {
        return false;
    }

}

// Allowance Token
async function allowance() {

    var tokenContract = new web3_other.eth.Contract(erc20Abi, token_address);
    try {
        var result = await tokenContract.methods.allowance(selectedAccount, multiSenderAddress).call();
        return parseFloat(web3_other.utils.fromWei(result, "ether"));
    } catch (Exception) {
        return 0;
    }
}

// Multi Tranfer
async function multiTransfer() {

    totalAmount = new BigNumber(web3_other.utils.toWei(totalAmount.toString(), "ether"));

    var receivers = [];
    address_arr.forEach(element => {
        receivers.push({
            wallet: element.wallet,
            amount: web3_other.utils.toWei(element.amount.toString(), "ether")
        })
    });

    value = new BigNumber(web3_other.utils.toWei(cost.toString(), "ether"));

    try {
        var result = await multiSenderContract.methods.multiTransfer(receivers, totalAmount, token_address, isBNB).send({ from: selectedAccount, value: value });
        return result.status;
    } catch (exception) {
        return 2;
    }

}



function onlyNumberKey(evt) {
    // Only ASCII character in that range allowed
    var ASCIICode = (evt.which) ? evt.which : evt.keyCode
    if (ASCIICode > 31 && (ASCIICode < 46 || ASCIICode > 57))
        return false;
    return true;
}



$("body").on('click', 'a.next', async function () {
    if (animating) return false;
    animating = true;

    var flag = false;

    current_fs = $(this).parent().parent().parent().parent().parent();
    next_fs = current_fs.next();

    if (validate_connection()) {
        if (current_fs.attr("class") == "first") {
            flag = save_values();

            if (flag) {
                set_table();
                if (!isBNB) {
                    if ((await allowance()) == 0)
                        $("#approve_check").text("Approve");
                    else
                        $("#approve_check").text("Next");
                } else {
                    $("#approve_check").text("Next");
                }
                //activate next step on progressbar using the index of next_fs
                $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");

                //show the next fieldset
                next_fs.show();
                current_fs.animate({ opacity: 0 }, {
                    step: function (now, mx) {
                        scale = 1 - (1 - now) * 0.2;
                        left = (now * 50) + "%";
                        opacity = 1 - now;
                        current_fs.css({
                            'transform': 'scale(' + scale + ')'
                        });
                        next_fs.css({ 'left': left, 'opacity': opacity });
                    },
                    duration: 500,
                    complete: function () {
                        current_fs.hide();
                        animating = false;
                    },
                    //this comes from the custom easing plugin
                    easing: 'easeInOutBack'
                });
                //hide the current fieldset with style
            }
            else {
                animating = false;
            }
        }

        if (current_fs.attr("class") == "second") {
            clear_confirmation();
            if ($("#approve_check").text() == "Approve") {
                $("#approve_check").attr("disabled", true);
                $("#approve_check").html(`<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>`)
                var result = await approve();
                if (result) {
                    $("#approve_check").text("Next");
                } else {
                    $("#approve_check").text("Approve");
                }
                $("#approve_check").removeAttr("disabled");
                animating = false;
            } else {
                $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");
                //show the next fieldset
                next_fs.show();
                current_fs.animate({ opacity: 0 }, {
                    step: function (now, mx) {
                        scale = 1 - (1 - now) * 0.2;
                        left = (now * 50) + "%";
                        opacity = 1 - now;
                        current_fs.css({
                            'transform': 'scale(' + scale + ')'
                        });
                        next_fs.css({ 'left': left, 'opacity': opacity });
                    },
                    duration: 500,
                    complete: function () {
                        current_fs.hide();
                        animating = false;
                    },
                    //this comes from the custom easing plugin
                    easing: 'easeInOutBack'
                });
                //hide the current fieldset with style

                var component = $("#waiting_list");
                var component1 = $("#success_list");
                var component2 = $("#failure_list");

                arrayToTextareaComponent(address_arr, component);
                $("#waiting_count").text(address_arr.length);

                $(".transaction_link a").attr("href", "#");
                $(".transaction_link a").text("TxID: ");
                $(".transaction_link").hide();

                var result = await multiTransfer();

                if (result == 0) {
                    $(".pending").hide();
                    $(".success_payment").hide();
                    $(".failure_payment").show();

                    component.val("").change();
                    component1.val("").change();
                    arrayToTextareaComponent(address_arr, component2);

                    $("#waiting_count").text(0);
                    $("#success_count").text(0);
                    $("#failure_count").text(address_arr.length);

                    $('#failure_list_label').trigger('click');
                }
                else if (result == 1) {
                    $(".pending").hide();
                    $(".success_payment").show();
                    $(".failure_payment").hide();

                    component.val("").change();
                    arrayToTextareaComponent(address_arr, component1);
                    component2.val("").change();

                    $("#waiting_count").text(0);
                    $("#success_count").text(address_arr.length);
                    $("#failure_count").text(0);

                    $('#success_list_label').trigger('click');

                    var netURL = pubChainId == 56 ? "https://bscscan.com/tx/" : "https://testnet.bscscan.com/tx/";
                    $(".transaction_link a").attr("href", netURL + txID);
                    $(".transaction_link a").text("TxID: " + txID);
                    $(".transaction_link").show();
                }
                else if (result == 2) {
                    $(".pending").hide();
                    $(".success_payment").hide();
                    $(".failure_payment").show();

                    arrayToTextareaComponent(address_arr, component);
                    component1.val("").change();
                    component2.val("").change();

                    $("#waiting_count").text(address_arr.length);
                    $("#success_count").text(0);
                    $("#failure_count").text(0);

                    $('#waiting_list_label').trigger('click');
                }
            }
        }
    } else {
        animating = false;
    }
});

$(".manual").click(async function () {

    var component = $("#waiting_list");
    var component1 = $("#success_list");
    var component2 = $("#failure_list");

    arrayToTextareaComponent(address_arr, component);
    $("#waiting_count").text(address_arr.length);
    $("#success_count").text(address_arr.length);
    $("#failure_count").text(address_arr.length);
    component1.val("").change();
    component2.val("").change();

    $(".transaction_link a").attr("href", "#");
    $(".transaction_link a").text("TxID: ");
    $(".transaction_link").hide();

    $(".pending").show();
    $(".success_payment").hide();
    $(".failure_payment").hide();
    totalAmount = 0;
    address_arr.forEach(element => {
        totalAmount += parseFloat(element.amount);
    });

    $(".transaction_link a").attr("href", "#");
    $(".transaction_link a").text("TxID: ");
    $(".transaction_link").hide();

    var result = await multiTransfer();

    if (result == 0) {
        $(".pending").hide();
        $(".success_payment").hide();
        $(".failure_payment").show();

        component.val("").change();
        component1.val("").change();
        arrayToTextareaComponent(address_arr, component2);

        $("#waiting_count").text(0);
        $("#success_count").text(0);
        $("#failure_count").text(address_arr.length);

        $('#failure_list_label').trigger('click');
    }
    else if (result == 1) {
        $(".pending").hide();
        $(".success_payment").show();
        $(".failure_payment").hide();

        component.val("").change();
        arrayToTextareaComponent(address_arr, component1);
        component2.val("").change();

        $("#waiting_count").text(0);
        $("#success_count").text(address_arr.length);
        $("#failure_count").text(0);

        $('#success_list_label').trigger('click');

        var netURL = pubChainId == 56 ? "https://bscscan.com/tx/" : "https://testnet.bscscan.com/tx/";
        $(".transaction_link a").attr("href", netURL + txID);
        $(".transaction_link a").text("TxID: " + txID);
        $(".transaction_link").show();
    }
    else if (result == 2) {
        $(".pending").hide();
        $(".success_payment").hide();
        $(".failure_payment").show();

        arrayToTextareaComponent(address_arr, component);
        component1.val("").change();
        component2.val("").change();

        $("#waiting_count").text(address_arr.length);
        $("#success_count").text(0);
        $("#failure_count").text(0);

        $('#waiting_list_label').trigger('click');
    }
})

$("body").on('click', 'a.previous', function () {
    if (animating) return false;
    animating = true;
    current_fs = $(this).parent().parent().parent().parent().parent();
    previous_fs = current_fs.prev();
    if (current_fs.attr("class") == "third") {
        $("#confirm-delete").modal("toggle");
        animating = false;
    }
    else {
        //de-activate current step on progressbar
        $("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");

        //show the previous fieldset
        previous_fs.show();
        current_fs.animate({ opacity: 0 }, {
            step: function (now, mx) {
                scale = 0.8 + (1 - now) * 0.2;
                left = ((1 - now) * 50) + "%";
                opacity = 1 - now;
                current_fs.css({ 'left': left });
                previous_fs.css({ 'transform': 'scale(' + scale + ')', 'opacity': opacity });
            },
            duration: 500,
            complete: function () {
                current_fs.hide();
                animating = false;
            },
            //this comes from the custom easing plugin
            easing: 'easeInOutBack'
        });
    }
});

$(".submit").click(function () {
    return false;
})

$(".lined").linedtextarea();

$("#upload_file").click(function () {
    var text = $(this).text();

    if (text == "Insert Manually") {
        $(this).text("Upload file");
        $(".hint-text").text("The address and amount are separated by commas");
        $(".show_example").text("Show examples");
        $(".files").hide();
        $(".linedwrap").show();
    } else if (text == "Upload file") {
        $(this).text("Insert Manually");
        $(".hint-text").text("Accepted: CSV / Excel / Txt");
        $(".show_example").text("Download examples");
        $(".files").show();
        $(".linedwrap").hide();
    }
})

$("input[type='file']").on('change', function () {
    if ($("#file_body").get(0).files.length == 0) {
        alert("Please upload the file first.");
        return;
    }
    let fileUpload = $("#file_body").get(0);
    let files = fileUpload.files;
    if (files[0].name.toLowerCase().lastIndexOf(".xlsx") == -1) {
        alert("Please upload only xls files");
        return;
    }

    if (!files.length) return;
    var file = files[0];

    var reader = new FileReader();
    reader.onloadend = function (event) {
        var arrayBuffer = reader.result;
        // debugger

        var options = { type: 'array' };
        var workbook = XLSX.read(arrayBuffer, options);

        var sheetName = workbook.SheetNames
        var sheet = workbook.Sheets[sheetName]

        var json_object = XLSX.utils.sheet_to_row_object_array(sheet);
        console.log(json_object);
        arrayToTextarea(json_object);

        $("#upload_file").text("Upload file");
        $(".hint-text").text("The address and amount are separated by commas");
        $(".show_example").text("Show examples");
        $(".files").hide();
        $(".linedwrap").show();
        $("#file_body").val('');
    };
    reader.readAsArrayBuffer(file);
});

$(".show_example").on('click', function (e) {
    if ($(this).text() == "Show examples") {
        var sample_arr = [
            {
                wallet: "0x81dead59e3a0423bed9ab5869901e41517458c1e",
                amount: "0.001"
            },
            {
                wallet: "0x81dead59e3a0423bed9ab5869901e41517458c1e",
                amount: "0.024"
            },
            {
                wallet: "0x81dead59e3a0423bed9ab5869901e41517458c1e",
                amount: "0.035"
            }
        ]
        arrayToTextarea(sample_arr);
    } else if ($(this).text() == "Download examples") {
        e.preventDefault();
        window.location.href = 'assets/xlsx/example.xlsx';
    }
});

$(".modal_open").click(function () {
    $("#amount").val("");
    $("#form").modal('toggle');
})

$("#confirm").click(function () {
    var amount = $("#amount").val();
    save_values();
    address_arr.forEach(element => {
        element.amount = amount;
    });
    arrayToTextarea(address_arr);
    $("#form").modal('toggle');
})

$("#address").bind('input propertychange paste change', function () {
    save_values();
});

$(".files").click(function () {
    $("#file_body").click();
})

$(window).resize(function () {
    $(".linedwrap").css('width', '100%');
    $(".lined").css('width', '100%');
});

function save_values() {
    address_arr = [];
    var text = $("#address").val();
    var line_arr = text.split("\n");
    var result = validate(line_arr);
    var flag = false;

    token_address = $("#token option:selected").attr("data-subtext");
    token = $("#token").val();
    if (result.flag) {
        line_arr.forEach(element => {
            var arr = element.split(",");
            if (arr.length > 1) {
                address_arr.push({
                    wallet: arr[0],
                    amount: arr[1]
                })
            }
        });
        $(".validate").hide();
        flag = result.flag
    } else {
        var messages = result.message;
        var message = "";
        messages.forEach(element => {
            message += element.message + "<br>";
        });
        $(".validate").show();
        $(".validate").html(message);
    }

    return flag;
}

function arrayToTextarea(arr) {
    var result = "";
    $("#address").val("").change();
    arr.forEach(element => {
        result += element.wallet + "," + element.amount + "\n";
    });

    $("#address").val(result).change();
}

function arrayToTextareaComponent(arr, component) {
    var result = "";
    component.val("").change();
    arr.forEach(element => {
        result += element.wallet + "," + element.amount + "\n";
    });

    component.val(result).change();
}

async function set_table() {
    isBNB = token == "BNB" ? true : false;
    $('.table tbody').children().remove();
    var row_id = 1;
    var total_num = 0;
    totalAmount = 0;
    var transaction_count = 1;
    var token_balance = 0;
    cost = 0;

    if (isBNB) {
        token_balance = await getBalance();
    } else {
        token_balance = await getTokenBalance();
    }
    var bnb_balance = await getBalance();

    token_balance = parseFloat(web3_other.utils.fromWei(token_balance, "ether")).toFixed(3);
    bnb_balance = parseFloat(web3_other.utils.fromWei(bnb_balance, "ether")).toFixed(3);

    var netURL = pubChainId == 56 ? "https://bscscan.com/address/" : "https://testnet.bscscan.com/address/";
    address_arr.forEach(element => {
        html = `<tr id="row_${row_id}">`;
        html += `<td class="heading-title underline"><a href="${netURL + element.wallet}" target="_blank">${element.wallet}</a> </td>`;
        html += `<td class="heading-title">${element.amount} ${token}</td>`;
        html += `<td class="heading-title"><a onclick="remove(${row_id})">Remove</a></td>`;
        html += '</tr>';

        $('.table tbody').append(html);

        row_id++;
        totalAmount += parseFloat(element.amount);
        console.log(parseFloat(element.amount));
    })

    $("#total_num").text(row_id - 1);
    $("#total_amount").text(totalAmount.toFixed(3) + " " + token);
    $("#token_balance").text(token_balance + " " + token);
    $("#bnb_balance").text(bnb_balance + " BNB");
    if (isBNB) {
        cost = parseFloat(web3_other.utils.fromWei(marketingFee.toString(), "ether")) + totalAmount;
        $("#cost").text(cost.toFixed(3) + " BNB")
    } else {
        cost = parseFloat(web3_other.utils.fromWei(marketingFee.toString(), "ether"));
        $("#cost").text(parseFloat(web3_other.utils.fromWei(marketingFee.toString(), "ether")).toFixed(3) + " BNB");
    }

}

function validate(array) {
    var line = 1;
    var error_message = [];
    array.forEach(element => {
        if (element != "") {
            var arr = element.split(",");
            if (arr.length != 2) {
                error_message.push({ line: line, message: `Line ${line} : ${element} is a invalid wallet address and wrong amount. E.g:address,number` })
            }
            line++;
        }
    });

    if (line == 1) {
        return { flag: false, message: [{ line: line, message: "Please enter at least one address information" }] }
    }

    if (error_message.length > 0) {
        return { flag: false, message: error_message }
    } else {
        return { flag: true, message: error_message }
    }
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drop(ev) {
    ev.preventDefault();
    var file;
    if (ev.dataTransfer.items) {
        if (ev.dataTransfer.items.length > 0) {
            if (ev.dataTransfer.items[0].kind === 'file') {
                file = ev.dataTransfer.items[0].getAsFile();
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        if (ev.dataTransfer.files.length > 0) {
            file = ev.dataTransfer.files[0];
        }
    }

    var reader = new FileReader();
    reader.onloadend = function (event) {
        var arrayBuffer = reader.result;
        // debugger

        var options = { type: 'array' };
        var workbook = XLSX.read(arrayBuffer, options);

        var sheetName = workbook.SheetNames
        var sheet = workbook.Sheets[sheetName]

        var json_object = XLSX.utils.sheet_to_row_object_array(sheet);
        arrayToTextarea(json_object);

        $("#upload_file").text("Upload file");
        $(".hint-text").text("The address and amount are separated by commas");
        $(".show_example").text("Show examples");
        $(".files").hide();
        $(".linedwrap").show();
        $("#file_body").val('');
    };
    reader.readAsArrayBuffer(file);
}

function remove(row_id) {
    address_arr.splice(row_id - 1, 1);
    set_table();
    if (address_arr.length == 0) {
        $(".next").attr("disabled");
    }
}

function validate_connection() {
    if (provider == null) {
        Swal.fire({
            icon: 'error',
            title: 'Connect wallet',
            text: 'Please connect your wallet'
        })
        return false;
    }
    return true;
}

function clear_confirmation() {
    $("#waiting_list").val("");
    $("#success_list").val("");
    $("#failure_list").val("");
    $("#waiting_count").text(0);
    $("#success_count").text(0);
    $("#failure_count").text(0);
    $(".pending").show();
    $(".success_payment").hide();
    $(".failure_payment").hide();
}

function showWalletModal() {
    $("#walletModal").modal("toggle");
    $("#wallet_address").text(selectedAccount);
}

function gotoBSC() {
    if (pubChainId == "56")
        window.open("https://bscscan.com/address/" + selectedAccount);
    if (pubChainId == "97")
        window.open("http://testnet.bscscan.com/address/" + selectedAccount);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function () {
        $(".copied").show();
        setInterval(function () {
            $(".copied").hide();
        }, 1500)
        clearInterval();
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });
}

function previous() {
    if (animating) return false;
    animating = true;
    current_fs = $(".third");
    previous_fs = current_fs.prev();
    set_table();

    $("#confirm-delete").modal("toggle");
    //de-activate current step on progressbar
    $("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");

    //show the previous fieldset
    previous_fs.show();
    current_fs.animate({ opacity: 0 }, {
        step: function (now, mx) {
            scale = 0.8 + (1 - now) * 0.2;
            left = ((1 - now) * 50) + "%";
            opacity = 1 - now;
            current_fs.css({ 'left': left });
            previous_fs.css({ 'transform': 'scale(' + scale + ')', 'opacity': opacity });
        },
        duration: 500,
        complete: function () {
            current_fs.hide();
            animating = false;
        },
        //this comes from the custom easing plugin
        easing: 'easeInOutBack'
    });
}

function logout() {
    onDisconnect();
    var index = $("#progressbar").find("li.active").length;

    if (index == 3) {
        if (animating) return false;
        animating = true;

        current_fs = $(".third");
        previous_fs = current_fs.prev();
        previous_previous_fs = previous_fs.prev();

        //de-activate current step on progressbar
        $("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");
        $("#progressbar li").eq($("fieldset").index(previous_fs)).removeClass("active");

        //show the previous fieldset
        previous_previous_fs.show();
        current_fs.animate({ opacity: 0 }, {
            step: function (now, mx) {
                scale = 0.8 + (1 - now) * 0.2;
                left = ((1 - now) * 50) + "%";
                opacity = 1 - now;
                current_fs.css({ 'left': left });
                previous_previous_fs.css({ 'transform': 'scale(' + scale + ')', 'opacity': opacity });
            },
            duration: 500,
            complete: function () {
                current_fs.hide();
                animating = false;
            },
            //this comes from the custom easing plugin
            easing: 'easeInOutBack'
        });
    } else if (index == 2) {
        if (animating) return false;
        animating = true;

        current_fs = $(".second");
        previous_fs = current_fs.prev();

        //de-activate current step on progressbar
        $("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");

        //show the previous fieldset
        previous_fs.show();
        current_fs.animate({ opacity: 0 }, {
            step: function (now, mx) {
                scale = 0.8 + (1 - now) * 0.2;
                left = ((1 - now) * 50) + "%";
                opacity = 1 - now;
                current_fs.css({ 'left': left });
                previous_fs.css({ 'transform': 'scale(' + scale + ')', 'opacity': opacity });
            },
            duration: 500,
            complete: function () {
                current_fs.hide();
                animating = false;
            },
            //this comes from the custom easing plugin
            easing: 'easeInOutBack'
        });
    } else {
        animating = false;
    }
}