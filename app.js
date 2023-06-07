const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertToPlayerDetails = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertToMatchDetails = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const totalScores = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    totalScore: dbObject.total_score,
    totalFours: dbObject.total_fours,
    totalSixes: dbObject.total_sixes,
  };
};

//1.GET players API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
      *
    FROM
      player_details
    ORDER BY
      player_id;`;
  const playersArray = await database.all(getPlayersQuery);
  const playerResult = playersArray.map((eachPlayer) => {
    return convertToPlayerDetails(eachPlayer);
  });
  response.send(playerResult);
});

//2.GET player API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
      * 
    FROM 
      player_details 
    WHERE 
      player_id = ${playerId};`;
  const player = await database.get(getPlayerQuery);
  const playerResult = convertToPlayerDetails(player);
  response.send(playerResult);
});

//3.PUT player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayerQuery = `
  UPDATE
    player_details
  SET
    player_name = '${playerName}'
  WHERE
    player_id = ${playerId};`;

  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//4.GET match API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
      * 
    FROM 
      match_details 
    WHERE 
      match_id = ${matchId};`;
  const match = await database.get(getMatchQuery);
  const matchResult = convertToMatchDetails(match);
  response.send(matchResult);
});

//5.GET player match API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `
    SELECT 
      * 
    FROM 
      player_match_score NATURAL JOIN match_details
    WHERE 
      player_id = ${playerId};`;
  const matchArray = await database.all(getMatchQuery);
  response.send(
    matchArray.map((eachMatch) => convertToMatchDetails(eachMatch))
  );
});

//6.GET match players API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerQuery = `
    SELECT 
      * 
    FROM 
      player_details NATURAL JOIN player_match_score
    WHERE 
      match_id = ${matchId};`;
  const playerArray = await database.all(getPlayerQuery);
  response.send(
    playerArray.map((eachPlayer) => convertToPlayerDetails(eachPlayer))
  );
});

//7.GET  API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayerQuery = `
    SELECT 
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM 
      player_details NATURAL JOIN player_match_score 
    WHERE 
      player_id = ${playerId};`;
  const playerMatchDetails = await database.get(getMatchPlayerQuery);
  response.send(playerMatchDetails);
});

module.exports = app;
