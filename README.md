<h4 align="center">🌐<a href="/readme.md">English</a> | <a href="/readme-ru.md">Русский</a>

<p align="center"> <img style="padding: 10px" align="center" alt="TourneyHelper logo" src="./branding/exports/logo.png" width="200"> </p>
<p align="center"> <img style="padding: 10px" align="center" alt="TourneyHelper label" src="./branding/exports/label.png" width="350"> </p>

<p align="center">
    <b> Software for automating tournament management and participant communication. </b>
</p>
<p align="center">
    <a href="https://pkg.go.dev/github.com/dreamervulpi/tourney-helper"><img src="https://img.shields.io/badge/Go.dev-reference-007d9c?logo=go&logoColor=white" alt="Go.dev"></a>
    <a href="https://github.com/DreamerVulpi/tourney-helper/releases">
        <img src="https://img.shields.io/badge/Version-0.3.0-blue" alt="Version">
    </a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/📄 License-MIT-green?logo=&logoColor=white" alt="License"></a>
    <a href="https://github.com/DreamerVulpi/tourney-helper/issues"><img src="https://img.shields.io/badge/🪲 Report a bug-Issues-red" alt="ReportBug"></a>
</p>
<p align="center">
    <a href="https://ko-fi.com/dreamervulpi"><img src="https://img.shields.io/badge/Donate-Ko--Fi-pink?logo=ko-fi" alt="Donate"></a>
    <a href="https://boosty.to/dreamervulpi"><img src="https://img.shields.io/badge/Subscription-Boosty-orange?logo=boosty" alt="Subscribe"></a>
</p>

## 💡 Features

### 📨 Automated Notification System for Tournament Participants
* In the current version ```0.3.0```:
    * Support for retrieving data from the [start.gg](https://www.start.gg/) tournament platform;
    * Support for sending messages via [Discord](https://discord.com/);
    * Support for tournaments for the following games: Tekken 8 and Street Fighter 6;
    * Supported tournament types: Singles (1-on-1);
    * Supported tournament formats: Single | Double Elimination (one loss | two losses);
    * Notifications are sent once every 5 minutes;
    * The matchmaking speed is ```82 players in ~ 3 minutes```, including player search and saving to a local database.
* The system determines:
    * who to send notifications to based on data from the tournament bracket and its own local database;
    * in which language to send messages to players (the default is English, but Russian is supported if a Discord role ID is specified);
    * which matches are played independently by players and which will be live-streamed—corresponding messages are sent.

    <!-- | Standard set | Set on stream |
    | ------------- | ------------- | 
    |  ![standardEN](./docs/images/standardMsgEN.png) | ![streamEN](./docs/images/streamMsgEN.png)| -->
* Thanks to the bot, the notification system allows you to retrieve a player's contact information directly from local storage via the messenger using the following command: ```/contact [in-game_nickname] [game_name]```

### 🗃️ Local player database
* Built-in search by in-game nicknames, contact usernames, or region;
* Automatic addition of players to the database from results found by the notification system;
* Ability to manually add players or import them via CSV or JSON files (using a template) into the database or ban list;
* Ability to copy a single player’s contact information in text format with one click to send to someone;
* Full control over data: Create, edit, delete, ban, and unban users;
* Support for your own ranking league with the ability to reset all players’ rankings with a single click;
* Support for a ban list with automatic removal of bans upon expiration;

## 🚀 Getting Started
1. Download the archive of the latest version from the “Releases” tab.
2. Extract it to a convenient folder.
3. Run ```TourneyHelper.exe```
<p>
   The necessary instructions and tips are available within the program itself when you click the "Help" button.
</p>

## 🗺️ Roadmap
1. Add metrics to track API load on platforms and messaging apps for future optimization;
2. Add a tournament bracket widget to display in the OBS with the corresponding functionality;
3. Add the ability for users to select which columns from the data warehouse they want to display;
4. Add new columns: email and mobile phone number;
5. Add unit tests to simplify project maintenance;
6. Increase the speed of email delivery compared to the current version, since the load on the API is currently minimal;
7. Add status indicators for all components;
8. Add the ability to download contact data for Tekken 8 using the API from [ewgh.gg](https://ewgf.gg/)
9. Add the ability to minimize the tab bar to increase the program’s workspace;
10. Add the ability to export the league player list in descending order as a text file;
11. Add a player stats widget for display in OBS with corresponding functionality;
12. Add support for other platforms for sending notifications;
13. Add support for more games;

## 📄 License

This project is licensed under the [MIT](./LICENSE) License.

© 2026 DreamerVulpi