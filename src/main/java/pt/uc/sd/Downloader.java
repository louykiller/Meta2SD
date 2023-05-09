package pt.uc.sd;// Downloader – São os componentes que obtêm as páginas Web em paralelo,
// as analisam (usando o jsoup) e atualizam o índice através de Multicast.

import org.jsoup.HttpStatusException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.InetAddress;
import java.net.MulticastSocket;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;
import java.rmi.registry.LocateRegistry;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.StringTokenizer;
public class Downloader implements Runnable{
    private final List<String> urlsQueue;
    private final Set<String> urlsVisited;

    private String MULTICAST_ADDRESS = "224.3.2.1";
    private int PORT = 4321;
    private int id;



    public Downloader(List<String> urlsQueue, Set<String> urlsVisited, int id){
        this.urlsQueue = urlsQueue;
        this.urlsVisited = urlsVisited;
        this.id = id;
    }

    public void run() {
        ServerActions su = null;
        try {
            su = (ServerActions) LocateRegistry.getRegistry(7000).lookup("server");
            su.updateDownloaderStatus(true, id, PORT);
        } catch (RemoteException | NotBoundException e) {
            e.printStackTrace();
        }

        // Iniciar socket
        MulticastSocket socket = null;
        String url = null;
        // Enquanto houver urls na queue
        try {
            // MULTICAST
            socket = new MulticastSocket();  // create socket without binding it (only for sending)
            InetAddress group = InetAddress.getByName(MULTICAST_ADDRESS);
            while (true) {
                if (urlsQueue.size() > 0) {
                    // Tentar ir buscar o proximo url
                    try {
                        url = urlsQueue.remove(0);
                    } catch (IndexOutOfBoundsException e){
                        continue;
                    }
                    // Se ja foi visitado
                    if(urlsVisited.contains(url)){
                        //System.out.println("Downloader " + id + ": URL já visitado! " + url);
                        String header = "url;" + url + "|title;null|citation;null";
                        DatagramPacket packet = new DatagramPacket(header.getBytes(), header.getBytes().length, group, PORT);
                        socket.send(packet);
                        continue;
                    }
                    HashSet<String> words = new HashSet<String>();
                    HashSet<String> urls = new HashSet<String>();
                    try {
                        // Aceder ao url
                        Document doc = Jsoup.connect(url).get();
                        // Titulo
                        String title = doc.title();
                        if (title.isEmpty()) {
                            throw new HttpStatusException("404 Page not found", 404, url);
                        }
                        // Retirar as palavras
                        StringTokenizer tokens = new StringTokenizer(doc.text());
                        while (tokens.hasMoreElements()) {
                            // Remover numeros e outros caracteres
                            String newToken = tokens.nextToken().toLowerCase().replaceAll("[^a-z]", "");
                            // Se sobrar algo, adicionar palavra
                            if (newToken.length() != 0)
                                words.add(newToken);
                        }
                        // Primeiro <p>
                        Elements paragraphs = doc.select("p:not(:has(#coordinates))");
                        String citation = "";
                        // Se houver um elemento <p> ir buscar o texto do primeiro
                        if (paragraphs.first() != null) {
                            citation = paragraphs.first().text();
                        }
                        // Retirar os links
                        Elements links = doc.select("a[href]");
                        for (Element link : links) {
                            // Adicionar link
                            String l = link.attr("abs:href");
                            // Verificar se é um link valido
                            if(l.startsWith("http"))
                                urls.add(l);
                        }
                        // Adicionar os links retirados ao fim da queue
                        urlsQueue.addAll(urls);

                        // header
                        // Reduzir o title
                        if(title.length() > 153)
                            title = title.substring(0, 150) + "...";
                        // Reduzir a citation
                        if(citation.length() > 253)
                            citation = citation.substring(0, 250) + "...";
                        String header = "url;" + url + "|title;" + title + "|citation;" + citation;
                        DatagramPacket packet = new DatagramPacket(header.getBytes(), header.getBytes().length, group, PORT);
                        socket.send(packet);
                        // Words
                        String wordsToSend = "";
                        int counter = 0;
                        for(String s : words){
                            if(counter % 5 == 0){
                                packet = new DatagramPacket(wordsToSend.getBytes(), wordsToSend.getBytes().length, group, PORT);
                                socket.send(packet);
                                wordsToSend = "";
                            }
                            wordsToSend += "word" + counter + ";" + s.toLowerCase() + "|";
                            counter++;
                        }
                        packet = new DatagramPacket(wordsToSend.getBytes(), wordsToSend.getBytes().length, group, PORT);
                        socket.send(packet);
                        // Links
                        String linksToSend = "";
                        counter = 0;
                        for(String s : urls){
                            if(counter % 5 == 0){
                                packet = new DatagramPacket(linksToSend.getBytes(), linksToSend.getBytes().length, group, PORT);
                                socket.send(packet);
                                linksToSend = "";
                            }
                            linksToSend += "link" + counter + ";" + s + "|";
                            counter++;
                        }
                        packet = new DatagramPacket(linksToSend.getBytes(), linksToSend.getBytes().length, group, PORT);
                        socket.send(packet);
                        // Adicionar o url a lista dos visitados
                        urlsVisited.add(url);

                        //SearchResult sr = new SearchResult(url, title, citation, null, null);
                        //System.out.println("Downloader " + id + ": " + url);

                    } catch (IllegalArgumentException e) {
                        System.out.println("Malformed URL: " + url);
                    } catch (HttpStatusException e) {
                        System.out.println("Couldn't access '" + e.getUrl() + "'");
                    } catch (IOException e) {
                        System.out.println("Error loading page");
                    }
                }

            }
        } catch (IOException e) {
            System.out.println("Socket Error");
            e.printStackTrace();
        }
        finally {
            socket.close();
            try {
                su.updateDownloaderStatus(false, id, PORT);
            } catch (RemoteException e) {
                throw new RuntimeException(e);
            }
        }
    }
}
