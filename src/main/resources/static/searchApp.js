var stompClient = null;
var currentResults = null;
var counter = 0;

// Codigo maioritariamente do stor
function connect() {
    var socket = new SockJS('/searchWebsocket');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        //setConnected(true);
        console.log('Connected: ' + frame);
        // Subscreve este "canal" para receber os resultados da pesquisa
        stompClient.subscribe('/search/results', function (message) {
            // Chama a função showResults cada vez que recebe uma mensagem
            showResults(JSON.parse(message.body).content);
        });
        // Subscreve este "canal" para receber os system updates
        stompClient.subscribe('/search/update', function (message) {
            // Chama a função newUpdate cada vez que recebe uma mensagem
            newUpdate(JSON.parse(message.body).content)
        });
        // Subscreve este "canal" para receber as news
        stompClient.subscribe('/search/news', function (message) {
            // Chama a função displayNews cada vez que recebe uma mensagem
            displayNews(JSON.parse(message.body).content)
        });
        // Subscreve este "canal" para gerir o user
        stompClient.subscribe('/user', function (message) {
            // Chama a função manageUser cada vez que recebe uma mensagem
            manageUser(JSON.parse(message.body))
        });
    });
}

// Codigo do stor
function disconnect() {
    if (stompClient !== null) {
        stompClient.disconnect();
    }
    //setConnected(false);
    console.log("Disconnected");
}

function manageUser(message){
    console.log(message);
}

// TODO: ainda por fazer
function userAction(){
    let json = {'action': 'login', 'username': 'username', 'password': 'password'};
    console.log(json);
    stompClient.send("/searchEngine/userAction", {}, JSON.stringify(json));
}

function search() {
    test('search');
    // ir buscar os search terms para fazer a pesquisa
    stompClient.send("/searchEngine/searchTerms", {}, JSON.stringify({'content': $("#searchBar").val()}));
}

// Função que recebe os resultados da pesquisa
function showResults(result) {
    test('Getting results');
    const res = JSON.parse(result);
    console.log(result);
    console.log(result.length);

    // Guardar os novos resultados
    currentResults = res;
    counter = 0;
    // Alterar o number of results
    $("#resultsCount").text("x resultados encontrados");
    let i = 0;
    // Adiciona os resultados à lista
    for(let r of res){
        if(i == 10) break;

        //$("#results").append("<tr><td>" + r["title"] + "</td><td><a href=\"" + r["url"] + "\">" + r["url"] + "</td><td>" + r["citation"] + "</td></tr>");
        $(".link").append('<a class="title" href="' + r["url"] + '"><p>' + r["url"] + '</p><h2>' + r["title"] + '</h2></a>' +
                          '<p class="citation">' + r["citation"] + '</p>');
        /*
        <a class="title" href="https://ucstudent.uc.pt/"><p>https://ucstudent.uc.pt/</p><h2>UC Student - Universidade de Coimbra</h2></a>
        <p class="citation">Citation</p>
        */
        i++;
    }
}

function index() {
    // Mandar URL para indexar para /searchEngine/indexURL
    stompClient.send("/searchEngine/indexURL", {}, JSON.stringify({'content': $("#searchBar").val()}));
    // Apagar o texto
    $("#searchBar").val("");
    // TODO: Pop up a confirmar
    alert("Your URL was sent to be indexed!");
}

function demandUpdates(){
    console.log("I WANT UPDATES!");
    // Mandar mensagem para /searchEngine/systemDetails a pedir updates
    stompClient.send("/searchEngine/systemDetails", {}, JSON.stringify({'content': "I WANT UPDATES!"}));
}

function newUpdate(update){
    // Alertar quando tem um update
    alert(update);
}


function getNews(){
    stompClient.send("/searchEngine/getNews", {}, JSON.stringify({'content': $("#searchBar").val()}));
}

function displayNews(news){
    const res = JSON.parse(news);
    for(let i of res){
        console.log(i);
        $("#results").append("<tr><td><a href=\"" + i["url"] + "\">" + i["title"] +"</a></td></tr>");
    }
}

/*
// Função do stor
function setConnected(connected) {
    $("#connect").prop("disabled", connected);
    $("#disconnect").prop("disabled", !connected);
    if (connected) {
        $("#conversation").show();
    }
    else {
        $("#conversation").hide();
    }
    $("#results").html("");
}
*/

function test(mes){
    console.log("Test " + mes);
}

$(function () {
    test("Start");
    // Conectar
    connect();
    // Ir buscar os parametros
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const searchTerms = urlParams.get('searchTerms');
    // Mudar o title e a searchBar
    $(document).attr("title", searchTerms + ' - Pesquisa Googol');
    $("#searchBar").val(searchTerms);
    setTimeout(() => {  search(); }, 200);



});


