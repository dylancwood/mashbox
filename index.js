/**
 * Mashbox
 * Plays video files found in a given directory in a loop using VLC.
 * Keeps track of which episode is playing, and resumes that episode from the beginning on restart.
 * Relies on VLC's ability to resume videos where they left off.
 */

const config = require('./config.json');
const fs = require('fs');
const { spawn } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const writeAsync = promisify(fs.writeFile);
const readAsync = promisify(fs.readFile);
const readDirAsync = promisify(fs.readdir);

const log = async function (logObject) {
  const stdLogObject = { date: (new Date()).toISOString(), data: logObject } 
  const logString = JSON.stringify(stdLogObject);
  console.log(logString);
  return writeAsync(config.logFilePath, logString, { flag: 'a' });
}; 

const writeState = async function (state) {
  const stateString = JSON.stringify(state, null, null, 2);
  return writeAsync(config.statusFilePath, stateString);
};

const readState = async function () {
  const stateString = await readAsync(config.statusFilePath, { encoding: 'utf-8' });
  const stateObj = JSON.parse(stateString);
  return stateObj;
};

const getNextEpisode = async function (currentEpisodeName) {
  const dirContents = await readDirAsync(config.episodeDir);
  dirContents.sort();

  const currentEpisodeIndex = dirContents.indexOf(currentEpisodeName);

  if (!currentEpisodeName) {
    return dirContents[0];
  }

  if (currentEpisodeIndex < 0) {
    log({ message: 'Could not find current episode', currentEpisodeName });
    return dirContents[0];
  }

  if (currentEpisodeIndex >= dirContents.length) {
    log ({ message: 'Reached last episode, starting from beginning', currentEpisodeName, currentEpisodeIndex, dirContentLength: dirContents.length });
    return dirContents[0];
  }

  log ({ message: 'Getting next episode', currentEpisodeName, currentEpisodeIndex, dirContentLength: dirContents.length, nextEpisode: dirContents[currentEpisodeIndex + 1] });
  return dirContents[currentEpisodeIndex + 1];
};

const initState = async function () {

  const currentEpisode = await getNextEpisode();

  return {
    currentEpisode
  };
};

const playEpisode = function (currentState) {
  const { currentEpisode: episodeName } = currentState;
  const episodePath = path.join(config.episodeDir, episodeName);

  const theseOptions = [episodePath].concat(config.vlcOptions);
  const childProcess = spawn(config.vlcExecutablePath, theseOptions);

  childProcess.on('close', (code) => {
    iterate(currentState);
  });

  childProcess.stdout.on('data', (data) => {
    log({ vlcStdout: data.toString('utf-8') });
  });

  childProcess.stderr.on('data', (data) => {
    log({ vlcStderr: data.toString('utf-8') });
  });
};

const iterate = async function (currentState) {
  const nextEpisode = await getNextEpisode(currentState.currentEpisode);

  const newState = Object.assign({}, currentState, { currentEpisode: nextEpisode });

  log({ message: 'Iterated to new episode', currentState, newState });

  await writeState(newState);

  playEpisode(newState);
};

const run = async function () {
  let currentState;
  try {
    currentState = await readState();
  } catch (err) {
    let state;
    if (err.code === 'ENOENT') {
      currentState = await initState();
      log({ message: 'State file not found, initializing state', error: err.toString() });
      writeState(currentState)
    } else {
      log({ message: 'Unexpected error reading state', error: err.toString() });
      throw err;
    }
  }
  
  playEpisode(currentState);
};

run();
