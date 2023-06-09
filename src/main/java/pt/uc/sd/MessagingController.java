package pt.uc.sd;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.jsoup.HttpStatusException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.ConnectException;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;
import java.rmi.registry.LocateRegistry;
import java.util.ArrayList;
import java.util.List;

@Controller
public class MessagingController {

    @Autowired
    private SimpMessagingTemplate template;

	// Função que vai receber os search terms mandados para /searchEngine/searchTerms e
    // devolve os resultados pelo "canal" /search/results
    @MessageMapping("/searchTerms")
    @SendTo("/search/results")
    public Message search(Message searchTerms) throws InterruptedException, RemoteException, NotBoundException {
        ServerActions ca = (ServerActions) LocateRegistry.getRegistry(7000).lookup("server");
        ArrayList<SearchResult> results = ca.search(searchTerms.content());
        return new Message(new Gson().toJson(results));
    }

    // Função que recebe URLS para indexar mandados para /searchEngine/indexURL
    @MessageMapping("/indexURL")
    public void indexURL(Message url) throws InterruptedException, RemoteException, NotBoundException {
        System.out.println("URL received " + url.content());
        ServerActions ca = (ServerActions) LocateRegistry.getRegistry(7000).lookup("server");
        ca.indexURL(url.content());
    }

    // Função que vai receber os pedidos de update mandados para /searchEngine/systemDetails e
    // devolve os resultados pelo "canal" /search/update
    @MessageMapping("/systemDetails")
    @SendTo("/search/system")
    public Details systemDetails(Message message) throws InterruptedException, RemoteException, NotBoundException {
        ServerActions ca = (ServerActions) LocateRegistry.getRegistry(7000).lookup("server");
        ArrayList<String> systemDetails = ca.getSystemDetails();
        ArrayList<String> topSearches = ca.getTopSearches();
        return new Details(systemDetails, topSearches);
    }

    @MessageMapping("/getNews")
    @SendTo("/search/update")
    public Message getNews(Message searchTerms) throws InterruptedException, IOException, NotBoundException {
        String search = searchTerms.content();
        if (search == null) {
            return null;
        }
        String topStoriesEndpoint = "https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty";
        // Buscar todas as top stories
        RestTemplate restTemplate = new RestTemplate();
        List hackerNewsNewTopStories = restTemplate.getForObject(topStoriesEndpoint, List.class);
        assert hackerNewsNewTopStories != null;
        // Guardar todas as stories que tenham os searchTerms
        List<HackerNewsItemRecord> hackerNewsItemRecordList = new ArrayList<>();
        int count = 0;
        for (int i = 0; i < hackerNewsNewTopStories.size(); i++) {
            // Fazer so as primeiras 50
            if(i == 50) break;
            // Ir buscar o URL da story
            Integer storyId = (Integer) hackerNewsNewTopStories.get(i);
            String storyItemDetailsEndpoint = String.format("https://hacker-news.firebaseio.com/v0/item/%s.json?print=pretty", storyId);
            HackerNewsItemRecord hackerNewsItemRecord = restTemplate.getForObject(storyItemDetailsEndpoint, HackerNewsItemRecord.class);
            // Verificar se existe e se o URL existe
            if (hackerNewsItemRecord == null || hackerNewsItemRecord.url() == null) { continue; }
            System.out.println("News number " + i + ": " + hackerNewsItemRecord.title() + " - " + hackerNewsItemRecord.url());
            // Verificar se contem os searchTerms
            List<String> searchTermsList = List.of(search.toLowerCase().split(" "));
            try {
                // Aceder ao url
                String doc = Jsoup.connect(hackerNewsItemRecord.url()).get().text();
                // Se sim adicionar à lista
                if (searchTermsList.stream().anyMatch(doc.toLowerCase()::contains)) {
                    System.out.println("Found!");
                    hackerNewsItemRecordList.add(hackerNewsItemRecord);
                    // Parar depois de 10 resultados encontrados
                    count++;
                    if(count == 10) break;
                }
            } catch (Exception e){
                continue;
            }
        }
        ServerActions ca = (ServerActions) LocateRegistry.getRegistry(7000).lookup("server");
        for(HackerNewsItemRecord story : hackerNewsItemRecordList){
            ca.indexURL(story.url());
        }
        if(hackerNewsItemRecordList.size() == 0){
            return new Message("No stories found relative to '" + search + "'.");
        }
        // Mandar em formato JSON
        return new Message(hackerNewsItemRecordList.size() + " stories were indexed relative to '" + search + "'.");
    }

    @MessageMapping("/indexStories")
    @SendTo("/search/update")
    public Message indexStories(Message username) throws InterruptedException, IOException, NotBoundException {
        String name = username.content();
        System.out.println(name);
        String userEndpoint = "https://hacker-news.firebaseio.com/v0/user/" + name + ".json?print=pretty";
        // Buscar todas as top stories
        RestTemplate restTemplate = new RestTemplate();
        HackerNewsUserRecord user = restTemplate.getForObject(userEndpoint, HackerNewsUserRecord.class);
        assert user != null;
        System.out.println(user.submitted().size());
        // Ir buscar todas as stories
        List<HackerNewsItemRecord> hackerNewsItemRecordList = new ArrayList<>();
        int count = 0;
        for (int i = 0; i < user.submitted().size(); i++) {
            // Ir buscar o URL da story
            Integer storyId = (Integer) user.submitted().get(i);
            String storyItemDetailsEndpoint = String.format("https://hacker-news.firebaseio.com/v0/item/%s.json?print=pretty", storyId);
            HackerNewsItemRecord hackerNewsItemRecord = restTemplate.getForObject(storyItemDetailsEndpoint, HackerNewsItemRecord.class);
            // Verificar se existe, se é uma story e se o URL existe
            if (hackerNewsItemRecord == null || !hackerNewsItemRecord.type().equals("story") || hackerNewsItemRecord.url() == null) { continue; }
            hackerNewsItemRecordList.add(hackerNewsItemRecord);
            System.out.println("Added story: " + hackerNewsItemRecord.title());
            // Parar depois de 10 resultados encontrados
            count++;
            if(count == 10) break;
        }
        // Indexar todos
        ServerActions ca = (ServerActions) LocateRegistry.getRegistry(7000).lookup("server");
        for(HackerNewsItemRecord story : hackerNewsItemRecordList){
            ca.indexURL(story.url());
        }
        return new Message("Indexed " + hackerNewsItemRecordList.size() + " stories from " + name);
    }


    @MessageMapping("/login")
    @SendTo("/search/user")
    public UserInfo login(UserInfo user) throws InterruptedException, RemoteException, NotBoundException {
        System.out.println("Message: " + user);
        ServerActions ca = (ServerActions) LocateRegistry.getRegistry(7000).lookup("server");
        User u = ca.login(user.username(), user.password());
        if(u == null) return new UserInfo(null, null, null, "login");
        return new UserInfo(u.name, u.username, null, "login");
    }

    @MessageMapping("/register")
    @SendTo("/search/user")
    public UserInfo register(UserInfo user) throws InterruptedException, RemoteException, NotBoundException {
        System.out.println("Message: " + user);
        ServerActions ca = (ServerActions) LocateRegistry.getRegistry(7000).lookup("server");
        User u = ca.register(user.username(), user.password(), user.name());
        if(u == null) return new UserInfo(null, null, null, "register");
        return new UserInfo(u.name, u.username, null, "register");
    }

    // Função que atualiza a cada 5 segundos os elementos
    @Scheduled(fixedRate = 5000)
    public void updateSystemDetails() throws RemoteException, NotBoundException {
        ServerActions ca = (ServerActions) LocateRegistry.getRegistry(7000).lookup("server");
        ArrayList<String> systemDetails = ca.getSystemDetails();
        ArrayList<String> topSearches = ca.getTopSearches();
        this.template.convertAndSend("/search/system", new Details(systemDetails, topSearches));
    }

}
