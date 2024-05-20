<?php
/*
    Plugin Name: Concept Graph
    Plugin URI: https://github.com/rusenaite/concept-graph-plugin
    Description: A WordPress plugin of concept graph visualization.
    Requires at least: 5.2
    Requires PHP: 7.2
    Version: 1.0
    License: GPL-3.0
    License URI: https://www.gnu.org/licenses/gpl-3.0.txt
    Author: Austėja Rušėnaitė
    Author URI: https://github.com/rusenaite/concept-graph-plugin
    Text Domain: concept-graph
    Domain Path: /languages
    Network: false
*/

// Hook for including scripts and styles
add_action('wp_enqueue_scripts', 'pluginScripts');
add_shortcode('concept_graph', 'pluginShortcode');

// Function to enqueue scripts and styles
function pluginScripts()
{
    if (is_page('grafas')) {
        wp_enqueue_style('pluginStyles', plugin_dir_url(__FILE__) . 'css/mainStyles.css');
        wp_enqueue_style('loaderStyles', plugin_dir_url(__FILE__) . 'css/loaderStyles.css');
        wp_enqueue_style('infoBarStyles', plugin_dir_url(__FILE__) . 'css/infoBarStyles.css');
        wp_enqueue_style('tooltipStyles', plugin_dir_url(__FILE__) . 'css/tooltipStyles.css');

        wp_enqueue_script('d3-js', 'https://d3js.org/d3.v4.js', [], false, true);
        wp_enqueue_script('pluginScript', plugin_dir_url(__FILE__) . '/js/script.js', array('wp-api', 'd3-js'), false, true);

        wp_localize_script('pluginScript', 'wpApiSettings', array(
            'root' => esc_url_raw(rest_url()),
            'nonce' => wp_create_nonce('wp_rest'),
            'posts' => 'wp/v2/posts?per_page=100',
            'tags' => 'wp/v2/tags?per_page=100',
        ));
    }
}

function pluginShortcode()
{
    wp_enqueue_style('pluginStyles', plugin_dir_url(__FILE__) . 'css/mainStyles.css');
    wp_enqueue_style('loaderStyles', plugin_dir_url(__FILE__) . 'css/loaderStyles.css');
    wp_enqueue_style('infoBarStyles', plugin_dir_url(__FILE__) . 'css/infoBarStyles.css');
    wp_enqueue_style('tooltipStyles', plugin_dir_url(__FILE__) . 'css/tooltipStyles.css');

    wp_enqueue_style('google-fonts-roboto', 'https://fonts.googleapis.com/css?family=Roboto&display=swap');
    wp_enqueue_script('d3-js', 'https://d3js.org/d3.v4.js', [], false, true);

    wp_enqueue_script('pluginScript', plugin_dir_url(__FILE__) . 'js/script.js', ['d3-js'], false, true);

    ob_start();
?>
    <div id="graph_visualization">
        <div id="loading-indicator" class="loader"></div>
        <button id="info-toggle">?</button>
        <div id="info-bar" style="display: none;">
            <div class="info-entry">
                <span class="term">Valdymas</span>
                <span class="description">Keiskite mastelį valdydami pelės ratuką ar keiskite grafo poziciją vilkdami jį pele.</span>
            </div>
            <div class="info-entry">
                <span class="term">Sąvokos aprašas</span>
                <span class="description">Pamatykite sąvokos aprašą užvedę kursorių ant pasirinktos sąvokos.</span>
            </div>
            <div class="info-entry">
                <span class="term">Sąvokų ryšiai</span>
                <span class="description">Paspaudę ant pasirinktos sąvokos galite pamatyti su šia sąvoka susijusias sąvokas.</span>
            </div>
        </div>
    </div>
<?php
    return ob_get_clean();
}
