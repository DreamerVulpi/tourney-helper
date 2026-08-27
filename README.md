<h4 align="center">🌐<a href="/README.md">English</a> | <a href="/README-RU.md">Русский</a>

<p align="center"> <img style="padding: 10px" align="center" alt="TourneyHelper logo" src="./branding/exports/logo.png" width="200"> </p>
<p align="center"> <img style="padding: 10px" align="center" alt="TourneyHelper label" src="./branding/exports/label.png" width="350"> </p>

<p align="center">
    <b> Software for automating tournament management and participant communication. </b>
</p>
<p align="center">
    <a href="https://pkg.go.dev/github.com/dreamervulpi/tourney-helper"><img src="https://img.shields.io/badge/Go.dev-reference-007d9c?logo=go&logoColor=white" alt="Go.dev"></a>
    <a href="https://github.com/DreamerVulpi/tourney-helper/releases"><img src="https://img.shields.io/badge/Version-0.4.0-blue" alt="Version"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/📄 License-MIT-green?logo=&logoColor=white" alt="License"></a>
    <a href="https://github.com/DreamerVulpi/tourney-helper/issues"><img src="https://img.shields.io/badge/🪲 Report a bug-Issues-red" alt="ReportBug"></a>
</p>
<p align="center">
    <a href="https://ko-fi.com/dreamervulpi"><img src="https://img.shields.io/badge/Donate-Ko--Fi-pink?logo=ko-fi" alt="Donate"></a>
    <a href="https://boosty.to/dreamervulpi"><img src="https://img.shields.io/badge/Subscription-Boosty-orange?logo=boosty" alt="Subscribe"></a>
</p>

## 💡 Features

### Current version ```0.4.0```
* Support for retrieving data from the [start.gg](https://www.start.gg/) tournament platform;
* Support for sending messages via [Discord](https://discord.com/);
* Support for tournaments for the following games: Tekken 8 and Street Fighter 6;
* Supported tournament types: Single (1-on-1);
* Supported tournament formats: Single | Double Elimination (up to one | two losses);
* Notifications are sent once every 5 minutes;
* The matchmaking speed is ```50–60 players per ~1 minute*```, including player search and saving to a local database.
    * *depending on the stability of your device’s connection to the platforms;
* The following metrics are displayed during matchmaking:
    * load with request rates per second/minute for each platform;
    * time (ms) per request;
    * time (ms) remaining until the end of the broadcast cycle, which is calculated in real time and corresponds to actual processing;
* The system determines:
    * who to send notifications to based on data from the tournament bracket and its local database;
    * in which language to send messages to the player (the default is English, but Russian can be selected. Role IDs will be required if your event includes players who speak different languages);
    * which matches are played independently by players and which will be live-streamed—corresponding messages are sent;
* Thanks to the bot, the notification system allows you to retrieve a player's contact information directly from local storage via the messenger using the following command: ```/contact [in-game_nickname] [game_name]```

### 📨 Automated Notification System for Tournament participants
* Support for retrieving data from the [start.gg](https://www.start.gg/) tournament platform;
* Support for sending messages via [Discord](https://discord.com/);
* Support for tournaments for the following games: Tekken 8 and Street Fighter 6;
* Supported tournament types: Single (1-on-1);
* Supported tournament formats: Single | Double Elimination (up to one | two losses);
* Notifications are sent once every 5 minutes;
* The matchmaking speed is ```50–60 players per ~1 minute*```, including player search and saving to a local database.
    * *depending on the stability of your device’s connection to the platforms;
* The following metrics are displayed during matchmaking:
    * load with request rates per second/minute for each platform;
    * time (ms) per request;
    * time (ms) remaining until the end of the broadcast cycle, which is calculated in real time and corresponds to actual processing;
* The system determines:
    * who to send notifications to based on data from the tournament bracket and its local database;
    * in which language to send messages to the player (the default is English, but Russian can be selected. Role IDs will be required if your event includes players who speak different languages);
    * which matches are played independently by players and which will be live-streamed—corresponding messages are sent:

### 🗃️ Local player database
* Built-in search by in-game nicknames, contact usernames, or region;
* Automatic addition of players to the database from results found by the notification system;
* Ability to manually add players or import them via CSV or JSON files (using a template) into the database or ban list;
* Ability to copy a single player’s contact information in text format with one click to send to someone;
* Full control over data: Create, edit, delete, ban, and unban users;
* Support for your own ranking league with the ability to reset all players’ rankings with a single click;
* Support for a ban list with automatic removal of bans upon expiration;

## 🚀 Getting Started
1. Download the archive of the latest version from the "Releases" tab.
2. Extract it to a convenient folder.
3. Run ```TourneyHelper.exe```
<p>
   The necessary instructions and tips are available within the program itself when you click the "Help" button.
</p>

## 🗺️ Roadmap
1. Add a separate platform authorization panel for easy use with future tools;
2. Add a tournament bracket widget for display in the OBS;
3. Add the ability for users to choose which columns from the data store they want to display;
4. Add new columns: email and mobile phone number;
5. Add the ability to import contact data for Tekken 8 using the API from [ewgf.gg](https://ewgf.gg/)
6. Add the ability to export the league player list in descending order as a text file;
6. Add a player stats widget to be displayed in the OBS with corresponding functionality;
7. Add support for other platforms for sending notifications;
8. Add support for more games;

## 📄 License

This project is licensed under the [MIT](./LICENSE) License.

© 2026 DreamerVulpi