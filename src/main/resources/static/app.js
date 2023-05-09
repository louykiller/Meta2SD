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
    demandUpdates();
    getNews();
    // ir buscar os search terms para fazer a pesquisa
    stompClient.send("/searchEngine/searchTerms", {}, JSON.stringify({'content': $("#searchBar").val()}));
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

const baseURL = "https://hacker-news.firebaseio.com/v0/";
// Função para ir buscar as top news
async function getNews(){
    console.log("Getting news")
    // Ir buscar os ids das top news
    const response = await fetch(baseURL + "topstories.json");
    const jsonData = await response.json();
    console.log(jsonData);
    // Por cada top news
    let count = 0;
    for(let i of jsonData){
        count += 1;
        if(count == 10){
            break;
        }
        // Ir buscar a info da news
        let res = await fetch(baseURL + "item/" + i + ".json");
        let data = await res.json();
        console.log(data);
        // Dar append à lista
        $("#results").append("<tr><td><a href=\"" + data["url"] + "\">" + data["title"] +"</a></td></tr>");
    }

}

function newUpdate(update){
    // Alertar quando tem um update
    alert(update);
}

// Função que recebe os resultados da pesquisa
function showResults(result) {
    // Passa para JSON
    console.log(result)
    result = result.replaceAll("&quot;", "\"");
    const res = JSON.parse(result);
    console.log(res);
    // Adiciona os resultados à lista
    for(let i of res){
        $("#results").append("<tr><td>" + i["title"] + "</td><td><a href=\"" + i["url"] + "\">" + i["url"] + "</td><td>" + i["citation"] + "</td></tr>");
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



