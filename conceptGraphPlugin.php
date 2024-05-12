<?php
/*
Plugin Name: Concept Graph
Plugin URI: https://github.com/rusenaite/concept-graph-plugin
Description: A WordPress plugin of concept graph visualization.
Version: 1.0
License: GPL-3.0
License URI: https://www.gnu.org/licenses/gpl-3.0.txt
Author: Austėja Rušėnaitė
Author URI: https://github.com/rusenaite/concept-graph-plugin
*/

// Hook for including scripts and styles
add_action('wp_enqueue_scripts', 'pluginScripts');
add_shortcode('concept_graph', 'pluginShortcode');

// Function to enqueue scripts and styles
function pluginScripts()
{
    // Enqueue the stylesheet
    wp_enqueue_style('pluginStyles', plugin_dir_url(__FILE__) . 'css/styles.css');

    // Enqueue D3.js from a CDN
    wp_enqueue_script('d3-js', 'https://d3js.org/d3.v4.js', [], false, true);

    // Enqueue plugin scripts
    //wp_enqueue_script('pluginScript', plugin_dir_url(__FILE__) . 'bundle.js', ['d3-js'], false, true);
    wp_enqueue_script('pluginScript', plugin_dir_url(__FILE__) . 'js/script.js', ['d3-js'], false, true);
    //wp_enqueue_script('api', get_template_directory_uri() . '/js/api.js', [], false, true);


    // Pass the URL of the JSON file to the script
    $data_url = plugin_dir_url(__FILE__) . 'data/data_1.json';
    wp_localize_script('pluginScript', 'myPluginInfo', array('dataUrl' => $data_url));
}

// Shortcode function to display HTML
function pluginShortcode()
{
    // Enqueue specific styles and scripts only when the shortcode is used
    wp_enqueue_style('google-fonts-roboto', 'https://fonts.googleapis.com/css?family=Roboto&display=swap');
    wp_enqueue_style('pluginStyles', plugin_dir_url(__FILE__) . 'css/styles.css');
    wp_enqueue_script('d3-js', 'https://d3js.org/d3.v4.js', [], false, true);
    wp_enqueue_script('pluginScript', plugin_dir_url(__FILE__) . 'js/script.js', ['d3-js'], false, true);

    ob_start();
?>
    <div id="loading-indicator" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 20px; z-index: 100; display: none;">
        Loading...
    </div>
    <div id="graph_visualization"></div>
<?php
    return ob_get_clean();
}
