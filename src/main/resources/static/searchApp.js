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
        stompClient.subscribe('/search/user', function (message) {
            // Chama a função userAction cada vez que recebe uma mensagem
            userAction(JSON.parse(message.body))
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

function login(){
    const username = $( "#usernameLogin" ).val();
    const password = $( "#passwordLogin" ).val();
    let json = {'username': username, 'password': password};
    stompClient.send("/searchEngine/login", {}, JSON.stringify(json));
}

function register(){
    const name = $( "#first_name" ).val() + ' ' + $( "#last_name" ).val();
    const username = $( "#username" ).val();
    const password1 = $( "#password1" ).val();
    const password2 = $( "#password2" ).val();
    if(password1 !== password2){
       console.log("Passwords dont match");
       // TODO: Notificacao
    }
    else{
        let json = {'name': name, 'username': username, 'password': password1};
        console.log(json);
        stompClient.send("/searchEngine/register", {}, JSON.stringify(json));
    }
}

// TODO: POR POP UPS BONITOS EM VEZ DE ALERTS
function userAction(user){
    console.log(user);
    if(user["action"] == "login"){
        if(user["username"] == null){
            alert("Couldn't log in. Invalid username/password");
        }
        else {
            alert("Logged In. Welcome back " + user["name"]);
            $('.close-btn').trigger('click');
            loggedIn(user["name"]);
        }
    }
    else {
        if(user["username"] == null){
            alert("Couldn't register. username already in use");
        }
        else {
            alert("Registered. Welcome " + user["name"]);
            $('.close-btn-register').trigger('click');
            loggedIn(user["name"]);
        }
    }
}

function loggedIn(name){
    $("#loggedOff").css("visibility", "hidden");
    $("#loggedIn").css("visibility", "visible");
    $("#name").text(name);
    localStorage.setItem("name", name);
}


function search() {
    // ir buscar os search terms para fazer a pesquisa
    stompClient.send("/searchEngine/searchTerms", {}, JSON.stringify({'content': $("#searchBar").val()}));
}

// Função que recebe os resultados da pesquisa
function showResults(result) {
    const res = JSON.parse(result);
    console.log(result);

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
        $(".link").append('<a class="title" href="' + r["url"] + '"><p>' + r["url"] + '</p>' +
                          '<h2>' + r["title"] + '</h2></a>' +
                          '<p class="citation">' + r["citation"] + '</p>');
        /*
        <a class="title" href="https://ucstudent.uc.pt/"><p>https://ucstudent.uc.pt/</p>
        <h2>UC Student - Universidade de Coimbra</h2></a>
        <p class="citation">Citation</p>
        */
        i++;
    }
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


$(function () {
    // Conectar
    connect();
    // Ir buscar os parametros
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const searchTerms = urlParams.get('searchTerms');
    // Mudar o title e a searchBar
    $(document).attr("title", searchTerms + ' - Pesquisa Googol');
    $("#searchBar").val(searchTerms);
    // Fazer a pesquisa
    setTimeout(() => { search(); }, 200);

    // Check if user is logged in
    const user = localStorage.getItem("name");
    if(user != null){
        loggedIn(user);
    }

    $( "#login" ).on("submit", function(e) {
        e.preventDefault();
        login();
    });
    $( "#register" ).on("submit", function(e) {
        e.preventDefault();
        register();
    });
    $(".logOut").click(function (e){
        localStorage.removeItem("name");
        alert("Logged Out!");
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


