function logout() {
    window.location.href = './logout';
}

function nascondiDIV() {
    document.getElementById("alertBox").style.display = "none";
    document.getElementById("alertBoxReload").style.display = "none";
    document.getElementById("alertBoxConfirm").style.display = "none";
    document.getElementById("back").style.display = "none";
}
function mostraAlert(msg) {
    document.getElementById("alertBox").style.display = "block";
    document.getElementById("msg").innerHTML = msg + "<br><br>";
    document.getElementById("back").style.display = "block";
}
function mostraAlertReload(msg) {
    document.getElementById("alertBoxReload").style.display = "block";
    document.getElementById("msgReload").innerHTML = msg + "<br><br>";
    document.getElementById("back").style.display = "block";
} 

function aggiorna() {
    location.reload();
}

function sendDataToBot() {
    var answer = (document.getElementById('exampleInputAnswer').value);
    var question = (document.getElementById('exampleInputQuestion').value);

    if (answer.trim() != "" && question.trim() != "") {
        $.post("./sendDataToBot", {
            answer: document.getElementById('exampleInputAnswer').value,
            question: document.getElementById('exampleInputQuestion').value
        },
            function (data, status) {
                if (status == "success") {
                    mostraAlert("Tra qualche minuto il tuo aiuto verrà reso disponibile a tutti i membri della compagnia. \n\nGrazie per il tuo prezioso contributo!");
                    document.getElementById("exampleInputAnswer").value = "";
                    document.getElementById("exampleInputQuestion").value = "";
                }
            });
    } else {
        mostraAlert("I campi domanda e risposta sono obbligatori!");
        document.getElementById("exampleInputAnswer").value = "";
        document.getElementById("exampleInputQuestion").value = "";
    }
}


// $.ajax({
//     type: "GET",
//     url: "url",
//     async: true,
//     cache: false,
//     success: function (data) {
//         var json = eval('(' + data + ')');
//         contaP();
//         document.getElementById("alertBox").style.display = "block";
//         document.getElementById("msg").innerHTML = json['risposta'] + "<br>";
//         document.getElementById("back").style.display = "block";
//     }
// });