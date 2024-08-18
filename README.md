Ship-WebGIS
Overview

Ship-WebGIS is a web-based Geographic Information System (GIS) application developed for tracking the locations of ships in real-time and displaying information about docks where these ships are currently docked. The application provides a dynamic map interface using Leaflet and simulates real-time ship movements.
Features

    Real-time Ship Tracking: Simulate and visualize the movement of ships in real-time based on predefined routes.
    Interactive Map: Display ships and docks as markers on a dynamic map. Clicking on a marker provides detailed information.
    Custom Basemaps: Switch between different basemaps (OpenStreetMap, Esri, etc.) for better visualization.
    Responsive Design: The web application is responsive, adapting to various screen sizes and devices.

Installation

    Clone the repository:

    bash

git clone https://github.com/your-username/ship-webgis.git

Navigate to the project directory:

bash

    cd ship-webgis

    Open the index.htm file in your web browser:

    Simply double-click the index.htm file, or you can use a local server like Live Server in VSCode for a better development experience.

Project Structure

    css/ - Contains the CSS files for styling the application.
    data/ - Contains the GeoJSON files for ship routes, docks, and ship positions.
    images/ - Contains images used for markers on the map.
    js/ - Contains the JavaScript files, including the main script.js which controls the map logic and ship simulation.
    index.htm - The main HTML file that loads the application.

Usage

    Loading Ship Data: Upon loading, the map will display ships and docks based on the data provided in the data/ folder.
    Interactive Markers: Clicking on a ship marker will display information such as the ship's name, ID, and the time of the position. Dock markers show dock name and capacity.
    Simulating Movement: The application simulates ship movements at regular intervals to create a real-time tracking experience.

Customization

    Adding New Ships or Docks:
        Modify the GeoJSON files in the data/ folder to add new ships or docks.
        Ensure the properties in the GeoJSON files match the expected format in script.js.

    Adjusting Simulation Speed:
        The simulation interval is currently set to 5000 ms (5 seconds). You can adjust this in the simulateShipMovement function inside script.js.

License

This project is licensed under the MIT License. See the LICENSE file for more details.
Contributing

Feel free to fork this project, submit pull requests, or report issues if you find any bugs or have feature suggestions.

This README provides a comprehensive overview of your project, making it easier for others to understand and contribute to it. You can customize this template as needed, especially under the "Customization" section, depending on how you'd like users to interact with or modify the project.
