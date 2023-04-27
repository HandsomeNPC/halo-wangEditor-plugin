package run.halo.stackedit;

import org.pf4j.PluginWrapper;
import org.springframework.stereotype.Component;
import run.halo.app.plugin.BasePlugin;

/**
 * @author ryanwang
 * @since 2.0.0
 */
@Component
public class StackEditPlugin extends BasePlugin {

    public StackEditPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Override
    public void start() {
    }

    @Override
    public void stop() {
    }
}
