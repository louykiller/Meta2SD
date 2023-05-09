package pt.uc.sd;

public class DownloaderElement extends SystemElements {
    public DownloaderElement(int id, int port, boolean active) {
        super(id, port, active);
    }

    @Override
    public String toString() {
        String t = "active";
        if(!this.active)
            t = "inactive";
        return "Downloader " + this.id + ", on port " + this.port + " is currently " + t;
    }
}
