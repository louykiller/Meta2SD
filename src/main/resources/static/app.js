var stompClient = null;

// Codigo maioritariamente do stor
function connect() {
    var socket = new SockJS('/searchWebsocket');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        setConnected(true);
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

    });
}

// Codigo do stor
function disconnect() {
    if (stompClient !== null) {
        stompClient.disconnect();
    }
    setConnected(false);
    console.log("Disconnected");
}

function search() {
    // TEST
    index();
    //demandUpdates();
    getNews();
    // ir buscar os search terms para fazer a pesquisa
    stompClient.send("/searchEngine/searchTerms", {}, JSON.stringify({'content': $("#searchBar").val()}));
}

// Função que recebe os resultados da pesquisa
function showResults(result) {
    const res = JSON.parse(result);
    // Adiciona os resultados à lista
    for(let i of res){
        $("#results").append("<tr><td>" + i["title"] + "</td><td><a href=\"" + i["url"] + "\">" + i["url"] + "</td><td>" + i["citation"] + "</td></tr>");
    }
}

function index() {
    // Mandar URL para indexar para /searchEngine/indexURL
    stompClient.send("/searchEngine/indexURL", {}, JSON.stringify({'content': $("#searchBar").val()}));
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

$(function () {
    $("form").on('submit', function (e) {
        e.preventDefault();
    });
    //$("#searchResults").hide();
    $( "#connect" ).click(function() { connect(); });
    $( "#disconnect" ).click(function() { disconnect(); });
    $( "#send" ).click(function() { search(); });

    // Serve para fazer disconnect antes de sair da pagina (talvez precisa de ser mudada)
    window.addEventListener('beforeunload', function (e) {
        console.log("Bye");
        disconnect();
        e.preventDefault();
        e.returnValue = '';
    });
});



