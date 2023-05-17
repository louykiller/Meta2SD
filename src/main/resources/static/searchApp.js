var stompClient = null;
var currentResults = null;
var page = 1;
var maxPage = 1;
var hackerNews;

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
            // Chama a função indexNews cada vez que recebe uma mensagem
            indexNews(JSON.parse(message.body).content)
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
       Swal.fire({
        title: 'Passwords dont match!',
        icon: 'info',
        confirmButtonText: 'Ok'
      })
    }
    else{
        let json = {'name': name, 'username': username, 'password': password1};
        stompClient.send("/searchEngine/register", {}, JSON.stringify(json));
    }
}

// TODO: POR POP UPS BONITOS EM VEZ DE ALERTS
function userAction(user){
    console.log(user);
    if(user["action"] == "login"){
        if(user["username"] == null){
            Swal.fire({
                title: 'Wrong credentials',
                text: 'Try again',
                icon: 'error',
                confirmButtonText: 'Ok'
              })
        }
        else {
            Swal.fire({
                title: 'Welcome back ' + user["name"],
                icon: 'success',
                confirmButtonText: 'Ok'
              })
            $('.close-btn').trigger('click');
            loggedIn(user["name"]);
        }
    }
    else {
        if(user["username"] == null){
            Swal.fire({
                title: 'Username already in use',
                text: 'Try again',
                icon: 'error',
                confirmButtonText: 'Ok'
              })
        }
        else {
            Swal.fire({
                title: 'Welcome ' + user["name"],
                icon: 'success',
                confirmButtonText: 'Ok'
              })
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
    if($("#searchBar").val() == ""){
        $("#previous").css("visibility", "hidden");
        $("#next").css("visibility", "hidden");
        return;
    }
    // ir buscar os search terms para fazer a pesquisa
    stompClient.send("/searchEngine/searchTerms", {}, JSON.stringify({'content': $("#searchBar").val()}));
}

function updateResults(current){
    // Remover o previous se for a primeira pagina
    if(current == 1){
        $("#previous").css("visibility", "hidden");
    } else {
        $("#previous").css("visibility", "visible");
    }
    // Remover o next se for a última página
    if(current == maxPage){
        $("#next").css("visibility", "hidden");
    } else{
        $("#next").css("visibility", "visible");
    }
    // Atualizar a lista e os numeros
    $("#page" + page).removeClass("current_number");
    $("#page" + page).addClass("number");
    $("#page" + current).removeClass("number");
    $("#page" + current).addClass("current_number");
    $(".link").empty();
    for(let i = (current - 1) * 10; i < ( (current - 1) * 10) + 10 && i < currentResults.length; i++){
        const r = currentResults[i];
        $(".link").append('<a class="title" href="' + r["url"] + '"><p>' + r["url"] + '</p>' +
                          '<h2>' + r["title"] + '</h2></a>' +
                          '<p class="citation">' + r["citation"] + '</p>');
        /*
        <a class="title" href="https://ucstudent.uc.pt/"><p>https://ucstudent.uc.pt/</p>
        <h2>UC Student - Universidade de Coimbra</h2></a>
        <p class="citation">Citation</p>
        */
    }
    page = current;
}

// Função que recebe os resultados da pesquisa
function showResults(result) {
    const res = JSON.parse(result);
    // Guardar os novos resultados
    currentResults = res;
    page = 1;
    maxPage = parseInt((res.length - 1) / 10) + 1;
    // Alterar o resultsCount
    if(res.length == 0){
        $("#resultsCount").text("0 resultados encontrados");
        $("#previous").css("visibility", "hidden");
        $("#next").css("visibility", "hidden");
    } else {
        $("#resultsCount").text(res.length + " resultados encontrados");
        $(".numbers").empty();
        // Adicionar o numero de paginas necessárias
        for(let i = 0; i < maxPage; i++){
            const n = i + 1;
            $(".numbers").append('<a id="page' + n + '" class="number">' + n + '</a>');
            $("#page" + n).click(function(e) {
                updateResults(n);
            });
        }
        updateResults(page);
    }
}


function newUpdate(update){
    // Alertar quando tem um update
    Swal.fire({
        title:"New Update!",
        text: update,
        icon: 'info',
        confirmButtonText: 'Ok'
      })
}

function getNews(){
    if($("#searchBar").val().length > 0){
    stompClient.send("/searchEngine/getNews", {}, JSON.stringify({'content': $("#searchBar").val()}));
    Swal.fire({
        title:"The Top Stories relative to '" + $("#searchBar").val() + "' will be indexed!",
        icon: 'info',
        confirmButtonText: 'Ok'
      })
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

    $(" #indexNews ").click(function (e){
        getNews();
    });
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
        Swal.fire({
            title:"Logged Out!",
            icon: 'info',
            confirmButtonText: 'Ok'
          })
    });

    $("#previous").click(function (e){
        updateResults(page - 1);
    });

    $("#next").click(function (e){
        updateResults(page + 1);
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


