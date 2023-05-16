package pt.uc.sd;// RMI Search Module – Este é o componente visível pelos clientes. Comunica com
//os Storage Barrels usando RMI (note que uma opção é usar RMI callbacks para
//cada Barrel). Este RMI Search Module não tem de armazenar quaisquer dados,
//dependendo inteiramente dos Storage Barrels para satisfazer os pedidos dos clientes.
// Uma possibilidade será escolher aleatoriamente um Storage Barrel para cada
//pesquisa, fazendo-se assim balanceamento de carga.

import java.io.*;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;
import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;
import java.rmi.server.UnicastRemoteObject;
import java.util.*;

public class RMISearchModule extends UnicastRemoteObject implements ServerActions, Runnable {
    private final List<String> urlsQueue;
    private final ArrayList<User> users;
    private final File f = new File("users.txt");
    public RMISearchModule(List<String> urlsQueue) throws RemoteException{
        super();
        this.urlsQueue = urlsQueue;
        this.users = new ArrayList<>();
        new Thread(this, "Server").start();
    }

    public void indexURL(String url) throws RemoteException{
        System.out.println("URL Recieved: " + url);
        if(url.startsWith("http")) {
            // Adds the URL to the start of the queue
            urlsQueue.add(0, url);
        }
    }

    public User login(String username, String password) throws RemoteException{
        // Check if the credentials are correct
        for(User u : users){
            // If it exists return the user
            if(u.hashCode() == Objects.hash(username, password)){
                System.out.println("User logged in: " + u.name);
                return u;
            }
        }
        // If not found return null
        return null;
    }

    public void logout() throws RemoteException{
        // Log out the user
        System.out.println("User logged out");
    }

    public User register(String username, String password, String name) throws RemoteException{
        // Verify credentials to see if there are no duplicates
        for(User u : users){
            // If it exists return null
            if(u.username.equals(username)){
                return null;
            }
        }
        // If not, create user and return it
        User newUser = new User(username, password, name);
        System.out.println("User registered: " + newUser.name);
        users.add(newUser);
        // Add it to the file
        try {
            FileWriter fw = new FileWriter(f, true);
            BufferedWriter bw = new BufferedWriter(fw);
            bw.write(username + ";" + password + ";" + name + "\n");
            bw.close();
        } catch (FileNotFoundException e) {
            System.out.println("File not found");
        } catch (IOException e){
            System.out.println("Error writing to user file");
        }
        return newUser;
    }
    private int barrelIndex;
    private final HashMap<String, Integer> searches = new HashMap<>();

    public ArrayList<SearchResult> search(String searchWords) throws RemoteException{
        ArrayList<SearchResult> results = new ArrayList<>();
        int count = 0;
        while(results.size() == 0) {
            if(count++ == 3)
                break;
            try {
                System.out.println("Trying on barrel " + barrelIndex);
                Search srch = (Search) LocateRegistry.getRegistry(8000 + barrelIndex).lookup("search");
                results = srch.search(searchWords);
                for(String s : searchWords.toLowerCase().split(" ")){
                    if(searches.containsKey(s))
                        searches.put(s, searches.get(s) + 1);
                    else
                        searches.put(s, 1);
                }
            } catch (NotBoundException e) {
                System.out.println("Couldn't get info from barrel " + barrelIndex);
            }
            barrelIndex++;
            if(barrelIndex == 3){
                barrelIndex = 0;
            }
        }
        return results;
    }
    public HashMap<String, SystemElements> elements = new HashMap<>();

    public void updateDownloaderStatus(boolean active, int id, int port) throws RemoteException {
        // Insert / Update the downloaderElement
        elements.put("D" + id, new DownloaderElement(id, port, active));
    }
    public void updateBarrelStatus(boolean active, int id, int port) throws RemoteException {
        // Insert / Update the barrelElement
        elements.put("B" + id, new BarrelElement(id, port, active));
    }

    public void printSystemDetails() throws RemoteException{
        try {
            // Gets the registry for the client print
            ClientPrint cp = (ClientPrint) LocateRegistry.getRegistry(7001).lookup("client");
            // System status (Barrels and Downloaders)
            cp.print("Estado do sistema:");
            for(SystemElements se : elements.values()){
                cp.print(se.toString());
            }
            // Top 10 Searches
            cp.print("\nTop 10 pesquisas:");
            int count = 0;
            for(String s : searches.keySet()){
                if(count++ == 10)
                    break;
                cp.print("- " + s);
            }

        } catch (NotBoundException e) {
            throw new RuntimeException(e);
        }
    }

    public ArrayList<String> getSystemDetails() throws RemoteException{
        ArrayList<String> systemElements = new ArrayList<>();
        for(SystemElements entry : elements.values()){
            systemElements.add(entry.toString());
        }
        Collections.sort(systemElements);
        return systemElements;
    }

    public ArrayList<String> getTopSearches() throws RemoteException {
        // TODO: Ordenar
        return new ArrayList<>(searches.keySet());
    }

    public void run() {
        barrelIndex = 0;
        // Ligar o server
        try {
            Registry r = LocateRegistry.createRegistry(7000);
            r.rebind("server", this);
            System.out.println("Search Module Server ready");
        } catch (RemoteException re) {
            System.out.println("Exception in RMISearchModule: " + re);
        }
        // Get all the info of users from text files
        try {
            FileReader fr = new FileReader(f);
            BufferedReader br = new BufferedReader (fr);
            String s;
            while((s = br.readLine()) != null){
                String[] data = s.split(";");
                users.add(new User(data[0], data[1], data[2]));
            }
            br.close();
        } catch (FileNotFoundException e) {
            System.out.println("File not found");
        } catch (EOFException e) {
            // EOF
        } catch (IOException e){
            System.out.println("Error reading user file");
            e.printStackTrace();
        }
    }

}
