package pt.uc.sd;

public class SystemElements {
    protected int id;
    protected int port;
    protected boolean active;

    public SystemElements(int id, int port, boolean active) {
        this.id = id;
        this.port = port;
        this.active = active;
    }
}
