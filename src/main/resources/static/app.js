var stompClient = null;

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
            manageUser(JSON.parse(message.body).content)
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

function userAction(){
    let json = {'action': 'login', 'username': 'username', 'password': 'password'};
    console.log(json);
    stompClient.send("/searchEngine/userAction", {}, JSON.stringify(json));
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
    // Apagar o texto
    $("#searchBar").val("");
    // Pop up a confirmar
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
    //$("#searchResults").hide();
    //document.title = "Test";
    /*
        // Serve para fazer disconnect antes de sair da pagina (talvez precisa de ser mudada)
        window.addEventListener('beforeunload', function (e) {
            console.log("Bye");
            disconnect();
            e.preventDefault();
            e.returnValue = "";
        });
        */


    connect();

    $( "#search" ).click(function (e) {
        // Ir para a pagina dos resultados
        test("search");
    });
    $( "#index" ).click(function (e) {
        // Indexar o que esta na searchBar
        index();
    });
    $( "#details" ).click(function (e) {
        // Abrir a página de detalhes do sistema
        test("details");
    });

    $( "#submitLogin" ).click(function(e) {
        e.preventDefault();
        test("Logged In " + $("#usernameLogin").val());
    });

    $( "#submitRegister" ).click(function(e) {
            e.preventDefault();
            test("Registered " + $("#username").val());
        });

    /* mostrar e sair do popup do log in*/
    $("#show-login").click(function(){
        $(".popup_login").addClass("active");
        $(".total").css("display", "flex");
    });
     $(".close-btn").click(function(){
        $(".popup_login").removeClass("active");
        $(".total").css("display", "none");
     });

    /* mostrar e sair do popup do register*/
    $("#show-register").click(function(){
        $(".popup_register").addClass("active");
        $(".total_register").css("display", "flex");
    });
    $(".close-btn-register").click(function(){
        $(".popup_register").removeClass("active");
        $(".total_register").css("display", "none");
    });

    /* redirecionar para o popup do register */
    $("#redirect_signUp").click(function(){
        $(".popup_login").removeClass("active");
        $(".total").css("display", "none");
    });
    $("#redirect_signUp").click(function(){
        $(".popup_register").addClass("active");
        $(".total_register").css("display", "flex");
    });

    /* redirecionar para o popup do login */
    $("#redirect_signIn").click(function(){
        $(".popup_register").removeClass("active");
        $(".total_register").css("display", "none");
    });
    $("#redirect_signIn").click(function(){
        $(".popup_login").addClass("active");
        $(".total").css("display", "flex");
    });
});


