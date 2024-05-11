<?php
/*
Plugin Name: Concept Graph
Plugin URI: https://github.com/rusenaite/concept-graph-plugin
Description: A WordPress plugin of concept graph visualization.
Version: 1.0
Author: Austėja Rušėnaitė
Author URI: https://github.com/rusenaite/concept-graph-plugin
*/

// Hook for including scripts and styles
add_action('wp_enqueue_scripts', 'pluginScripts');

// Function to enqueue your scripts and styles
function pluginScripts() {
    // Enqueue the stylesheet
    wp_enqueue_style('pluginStyles', plugin_dir_url(__FILE__) . 'css/styles.css');

    // Enqueue D3.js from a CDN
    wp_enqueue_script('d3-js', 'https://d3js.org/d3.v4.js', [], false, true);

    // Enqueue your custom script
    wp_enqueue_script('pluginScript', plugin_dir_url(__FILE__) . 'js/script.js', ['d3-js'], false, true);

    // Pass the URL of the JSON file to the script
    $data_url = plugin_dir_url(__FILE__) . 'data/data_1.json'; // Adjust if your JSON file is in a subdirectory
    wp_localize_script('pluginScript', 'myPluginInfo', array('dataUrl' => $data_url));

    // This is where you can also enqueue other scripts or styles if needed
}
add_action('wp_enqueue_scripts', 'my_basic_plugin_scripts');

// Hook for adding your content via a shortcode
add_shortcode('conceptGraphPlugin', 'myBasicPluginShortcode');

// Shortcode function to display HTML
function myBasicPluginShortcode() {
    // Enqueue specific styles and scripts only when the shortcode is used
    wp_enqueue_style('google-fonts-roboto', 'https://fonts.googleapis.com/css?family=Roboto&display=swap');
    wp_enqueue_style('pluginStyles', plugin_dir_url(__FILE__) . 'css/styles.css');
    wp_enqueue_script('d3-js', 'https://d3js.org/d3.v4.js', [], false, true);
    wp_enqueue_script('pluginScript', plugin_dir_url(__FILE__) . 'js/script.js', ['d3-js'], false, true);

    ob_start();
    ?>
    <!-- Your Updated HTML content goes here -->
    <div id="graph_visualization"></div>
    <?php
    return ob_get_clean();
}