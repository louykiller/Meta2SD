package pt.uc.sd;// Index Storage Barrel – É o servidor central (replicado) que armazena todos os
//dados da aplicação, recebendo os elementos do índice (palavras e URLs) através de Multicast,
// enviados pelos Downloaders. Para tal, deverão aplicar um protocolo
// de multicast fiável, uma vez que todos os storage barrels devem ter informação
// idêntica ainda que possam existir avarias de omissão.

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.net.DatagramPacket;
import java.net.InetAddress;
import java.net.MulticastSocket;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;
import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;
import java.rmi.server.UnicastRemoteObject;
import java.util.*;
import java.util.Map.Entry;


public class IndexStorageBarrel extends UnicastRemoteObject implements Search, Runnable {

    private String MULTICAST_ADDRESS = "224.3.2.1";
    private int PORT = 4321;
    private final int id;

    public HashMap<String,ArrayList<String>> words_a_m = new HashMap<>();
    public HashMap<String,ArrayList<String>> words_n_z = new HashMap<>();
    public HashMap<String,ArrayList<String>> url_a_m = new HashMap<>();
    public HashMap<String,ArrayList<String>> url_n_z = new HashMap<>();

    private HashMap<String, SearchResult> knownUrls = new HashMap<>();
    private HashMap<String, Set<String>> parentUrls = new HashMap<>();
    private HashMap<String, Set<String>> wordsToUrls = new HashMap<>();


    public static class CustomComparator implements Comparator<SearchResult> {
        @Override
        public int compare(SearchResult sr1, SearchResult sr2) {
            try {
                if (sr1.parentUrls.size() == sr2.parentUrls.size())
                    return 0;
                return sr1.parentUrls.size() > sr2.parentUrls.size() ? -1 : 1;
            } catch (NullPointerException e){
                return 0;
            }
        }
    }

    /**
     *
     * @param searchWords
     * @return urls of searched word by relevance
     * @throws RemoteException
     */
    @Override
    public ArrayList<SearchResult> search(String searchWords) throws RemoteException {
        // TODO: Ir buscar os 10 mais relevantes para a pesquisa
        HashSet<String> potentialresults = new HashSet<>();
        // Get all potentialResults form the words
        for(String s : searchWords.toLowerCase().split(" ")){
            //Set<String> temp = wordsToUrls.get(s);

            ArrayList<String> aux = new ArrayList<>();
            if(Character.compare(s.charAt(0),'n') <0){
                aux = words_a_m.get(s);
            }
            else{
                aux = words_n_z.get(s);
            }
            try {
                Set<String> temp = new HashSet<>(aux);
                if (temp.size() != 0)
                    potentialresults.addAll(wordsToUrls.get(s));
            } catch (NullPointerException e){

            }
        }
        // Get all the Search Results
        ArrayList<SearchResult> results = new ArrayList<>();
        for(String s : potentialresults){
            results.add(knownUrls.get(s));
        }
        // Sort them
        results.sort(new CustomComparator());
        return results;
    }

    /**
     * add to url barrels
     * note: meaning of names switched because previous implementations
     * @param key_url url to be added to the list of a given url
     * @param value_url url to serve as key in the hash map
     */
    public void addToUrl(String key_url,String value_url){
        String[] data = value_url.split("://");
        char firstChar = data[1].charAt(0);
        char upperFirst = Character.toUpperCase(firstChar);

        //find what barrel it belongs to
        if(Character.compare(upperFirst, 'N') < 0){
            //if value_url is already a key in the hashmap update its value
            if(this.url_a_m.containsKey(value_url)){
                ArrayList<String> urls = new ArrayList<String>();
                urls = this.url_a_m.get(value_url);
                if(!(urls == null)) {
                    if (!(urls.contains(key_url))) {
                        this.url_a_m.get(value_url).add(key_url);
                    }
                }
            }
            //add new key and value to the hash map
            else{
                ArrayList<String> newArray = new ArrayList<String>();
                newArray.add(key_url);
                this.url_a_m.put(value_url,newArray);
            }
        }
        else{
            if(this.url_n_z.containsKey(value_url)){
                ArrayList<String> urls = new ArrayList<String>();
                urls = this.url_n_z.get(value_url);
                if(!(urls == null)){
                    if(!(urls.contains(key_url))){
                        this.url_n_z.get(value_url).add(key_url);
                    }
                }
            }
            else{
                ArrayList<String> newArray = new ArrayList<String>();
                newArray.add(key_url);
                this.url_n_z.put(value_url,newArray);
            }
        }
    }

    /**
     * add to word barrel
     * note: meaning of names switched because previous implementations
     * @param key_url key_url url to be added to the list of a given word
     * @param value_word word to serve as key in the hash map
     */
    public  void addToWord(String key_url,String value_word){
        char firstChar = value_word.charAt(0);
        char upperFirst = Character.toUpperCase(firstChar);

        //find what barrel it belongs to
        if(Character.compare(upperFirst, 'N') < 0){
            //if value_word is already a key in the hashmap update its value
            if(this.words_a_m.containsKey(value_word)){
                ArrayList<String> urls = new ArrayList<String>();
                urls = this.words_a_m.get(value_word);
                if(!(urls == null)) {
                    if (!(urls.contains(key_url))) {
                        this.words_a_m.get(value_word).add(key_url);
                    }
                }
            }
            //add new key and value to the hash map
            else{
                ArrayList<String> newArray = new ArrayList<String>();
                newArray.add(key_url);
                this.words_a_m.put(value_word,newArray);
            }
        }
        else{
            if(this.words_n_z.containsKey(value_word)){
                ArrayList<String> urls = new ArrayList<String>();
                urls = this.words_n_z.get(value_word);
                if(!(urls == null)) {
                    if (!(urls.contains(key_url))) {
                        this.words_n_z.get(value_word).add(key_url);
                    }
                }
            }
            else{
                ArrayList<String> newArray = new ArrayList<String>();
                newArray.add(key_url);
                this.words_n_z.put(value_word,newArray);
            }
        }
    }


    public IndexStorageBarrel(int id) throws RemoteException {
        this.id = id;
    }

    public void writeBarrels(){
        try{
            BufferedWriter out = new BufferedWriter(new FileWriter("barrel_out.txt", true));

            // Writing on output stream
            out.write("==== Info in the words a__ barrel =====\n");
            for (Entry<String, ArrayList<String>> set : this.words_a_m.entrySet()) {
                out.write("Palavra *" + set.getKey() +"* associada a\n");
                for (String x : set.getValue()){
                    out.write("- " + x + '\n');
                }
            }

            out.write("==== Info in the words n_z barrel =====\n");
            for (Entry<String, ArrayList<String>> set : this.words_n_z.entrySet()) {
                out.write("Palavra *" + set.getKey() +"* associada a\n");
                for (String x : set.getValue()){
                    out.write("- " + x + '\n');
                }
            }

            out.write("==== Info in the url a__ barrel =====\n");
            for (Entry<String, ArrayList<String>> set : this.url_a_m.entrySet()) {
                out.write("Url *" + set.getKey() +"* contem os seguintes urls\n");
                for (String x : set.getValue()){
                    out.write("- " + x + '\n');
                }
            }

            out.write("==== Info in the url n_z barrel =====\n");
            for (Entry<String, ArrayList<String>> set : this.url_n_z.entrySet()) {
                out.write("Url *" + set.getKey() +"* contem os seguintes urls\n");
                for (String x : set.getValue()){
                    out.write("- " + x + '\n');
                }
            }
        }
        catch (IOException e){
            System.out.println(e);
        }
    }

    public void run(){
        Registry r = null;
        ServerActions su = null;
        try {
            r = LocateRegistry.createRegistry(8000 + id);
            r.rebind("search", this);
            su = (ServerActions) LocateRegistry.getRegistry(7000).lookup("server");
            su.updateBarrelStatus(true, id, PORT);
        } catch (RemoteException | NotBoundException e) {
            e.printStackTrace();
        }
        MulticastSocket socket = null;
        try{
            socket = new MulticastSocket(PORT);
            InetAddress group = InetAddress.getByName(MULTICAST_ADDRESS);
            socket.joinGroup(group);

            String url = "", title = "", citation = "";
            ArrayList<String> words = new ArrayList<>();
            ArrayList<String> urls = new ArrayList<>();

            //printBarrels();

            while(true){
                // Recieve packets
                byte[] buffer = new byte[1050];
                DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                socket.receive(packet);
                String p = new String(packet.getData(), 0, packet.getLength());

                // Se o length for menor que 4, houve algum erro
                if(p.length() < 4)
                    continue;
                String[] stuff = p.split("\\|");
                // Verificar a primeira palavra (word ou link)
                // Words (wordX;"something")
                if(stuff[0].startsWith("word")){
                    for(String s : stuff){
                        String[] temp = s.split(";");
                        if(temp.length > 1)
                            words.add(temp[1]);
                    }
                }
                // Links (linkX;"something")
                else if (stuff[0].startsWith("link")){
                    for(String s : stuff){
                        String[] temp = s.split(";");
                        if(temp.length > 1)
                            urls.add(temp[1]);
                    }
                }
                // Header (url;"something"|title;"something"|citation;"something")
                else if (stuff[0].startsWith("url")){
                    if(!url.equals("")){
                        // TODO: Adicionar ao barrel
                        SearchResult sr = new SearchResult(url,title, citation);
                        // Update known urls
                        knownUrls.put(url, sr);
                        // Update child urls
                        for (String x : urls){
                            Set<String> temp = new HashSet<>();
                            // If already exists replace it
                            if(parentUrls.containsKey(x)){
                                temp = parentUrls.get(x);
                            }
                            // Add the url
                            temp.add(url);
                            parentUrls.put(x, temp);
                            //add to specific barrel
                            addToUrl(url,x);

                        }
                        // Update wordsToUrls
                        for(String x : words){
                            Set<String> temp = new HashSet<>();
                            // If already exists replace it
                            if(wordsToUrls.containsKey(x)){
                                temp = wordsToUrls.get(x);
                            }
                            // Add the url
                            temp.add(url);
                            wordsToUrls.put(x, temp);
                            //add to specific barrel
                            addToWord(url,x);

                        }


                        // Atualizar a lista de parentUrls
                        if(parentUrls.containsKey(url))
                            knownUrls.get(url).parentUrls = new ArrayList<>(parentUrls.get(url));

                        words = new ArrayList<String>();
                        urls = new ArrayList<String>();

                        writeBarrels();

                    }
                    // url
                    String[] temp = stuff[0].split(";");
                    if(temp.length > 1)
                        url = temp[1];
                    // title
                    temp = stuff[1].split(";");
                    if(temp.length > 1)
                        title = temp[1];
                    // citation
                    if(stuff[2].length() > 9)
                        citation = stuff[2].substring(9);
                }
            }
        }
        catch (IOException e) {
            e.printStackTrace();
        } finally {
            socket.close();
            try {
                su.updateBarrelStatus(false, id, PORT);
            } catch (RemoteException e) {
                throw new RuntimeException(e);
            }
        }
    }

}





















