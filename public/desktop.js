// Desktop js

document.getElementById("loading-screen").style.display = "none";
document.getElementById("loggedin").style.display = "flex";

let token;
let isPlayerReady = false;



function updateProfile(data) {
    let imageUrl = data.images.length > 0 ? data.images[0].url : 'assets/default-image.png';
    document.getElementById('user-name').textContent = data.display_name;
    document.querySelectorAll('.user-image').forEach(img => img.src = imageUrl);
}

function updateVolumeIcon(volumeValue) {
    const volumeLowIcon = document.getElementById('volumeLowIcon');
    const volumeMuteIcon = document.getElementById('volumeMuteIcon');
    const volumeFullIcon = document.getElementById('volumeFullIcon');

    if (volumeValue == 0) {
        volumeMuteIcon.classList.remove('hidden');
        volumeLowIcon.classList.add('hidden');
        volumeFullIcon.classList.add('hidden');
    } else if (volumeValue < 50) {
        volumeLowIcon.classList.remove('hidden');
        volumeMuteIcon.classList.add('hidden');
        volumeFullIcon.classList.add('hidden');
    } else {
        volumeFullIcon.classList.remove('hidden');
        volumeMuteIcon.classList.add('hidden');
        volumeLowIcon.classList.add('hidden');
    }
}

function setVolumeFromSlider() {
    const slider = document.getElementById('volumeSlider');
    slider.addEventListener('input', function(e) {
        let volume = e.target.value / 100; // Convert the range from 0-100 to 0-1
        if (player) {
            player.setVolume(volume).catch(error => {
                console.error("Error adjusting volume:", error);
            });
        }
        updateVolumeIcon(e.target.value);
    });
    updateVolumeIcon(slider.value);
}

let lastVolumeBeforeMute = 0.2; // default value

function muteOrRestoreVolume() {
    if (player) {
        player.getVolume().then(volume => {
            if (volume > 0) {
                lastVolumeBeforeMute = volume;
                player.setVolume(0).then(() => {
                    updateVolumeIcon(0);
                    document.getElementById('volumeSlider').value = 0;
                });
            } else {
                player.setVolume(lastVolumeBeforeMute).then(() => {
                    updateVolumeIcon(lastVolumeBeforeMute * 100);
                    document.getElementById('volumeSlider').value = lastVolumeBeforeMute * 100;
                });
            }
        }).catch(error => {
            console.error("Error getting or setting volume:", error);
        });
    }
}

document.getElementById('volumeLowIcon').addEventListener('click', muteOrRestoreVolume);
document.getElementById('volumeFullIcon').addEventListener('click', muteOrRestoreVolume);
document.getElementById('volumeMuteIcon').addEventListener('click', muteOrRestoreVolume);


function populatePlaylistDetails(playlistId, playlistName, playlistImageURL, playlistOwnerName) {
    $.ajax({
        url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function(response) {
            // Update playlist image, name, and owner
            const playlistContainer = document.querySelector('.playlist-container');
            const playlistImage = playlistContainer.querySelector('#playlist-image');
            const playlistNameElement = playlistContainer.querySelector('#playlist-name');
            const playlistOwner = playlistContainer.querySelector('#playlist-owner');

            playlistImage.src = playlistImageURL;
            playlistNameElement.textContent = playlistName;
            if (playlistOwnerName) {
                playlistOwner.textContent = playlistOwnerName;
            } else {
                playlistOwner.textContent = "Unknown Owner";
            }

            // Create table and headers
            let table = document.createElement('table');
            table.classList.add('text-left', 'playlist-table');
            table.style.tableLayout = 'auto';

            let thead = document.createElement('thead');
            let tr = document.createElement('tr');

            ['#', 'Title', 'Album', 'Date added', 'Time'].forEach(header => {
                let th = document.createElement('th');
                th.textContent = header;
                tr.appendChild(th);
            });

            thead.appendChild(tr);
            table.appendChild(thead);
            let tbody = document.createElement('tbody');

            // Populate table rows with data
            response.items.forEach((item, index) => {
                let tr = document.createElement('tr');

                // #
                let tdNumber = document.createElement('td');
                tdNumber.textContent = index + 1;
                tr.appendChild(tdNumber);

                // Title (image + name)
                let tdTitle = document.createElement('td');
                let wrapperDiv = document.createElement('div');
                wrapperDiv.style.display = 'flex';
                wrapperDiv.style.alignItems = 'center'; 
                wrapperDiv.style.width = '100%';

                let img = document.createElement('img');
                img.src = item.track.album.images.length > 0 ? item.track.album.images[0].url : 'assets/default-image.png';
                img.alt = item.track.name;
                img.style.width = '40px';
                img.style.marginRight = '10px';

                let span = document.createElement('span');
                span.textContent = item.track.name;
                span.style.flexGrow = '1';
                span.style.overflow = 'hidden';
                span.style.textOverflow = 'ellipsis';
                span.style.whiteSpace = 'nowrap';
                span.style.paddingRight = '10px';

                wrapperDiv.appendChild(img);
                wrapperDiv.appendChild(span);
                tdTitle.appendChild(wrapperDiv);
                tr.appendChild(tdTitle);

                // Album
                let tdAlbum = document.createElement('td');
                tdAlbum.textContent = item.track.album.name;
                tdAlbum.style.paddingRight = '10px';
                tr.appendChild(tdAlbum);

                // Date added
                let tdDateAdded = document.createElement('td');
                let dateAdded = new Date(item.added_at).toLocaleDateString();
                tdDateAdded.textContent = dateAdded;
                tr.appendChild(tdDateAdded);

                // Time
                let tdTime = document.createElement('td');
                let minutes = Math.floor(item.track.duration_ms / 60000);
                let seconds = Math.floor((item.track.duration_ms % 60000) / 1000);
                let time = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
                tdTime.textContent = time;
                tr.appendChild(tdTime);

                tbody.appendChild(tr);
            });

            table.appendChild(tbody);
            let playlistTracks = document.getElementById('playlist-tracks');
            playlistTracks.innerHTML = '';  // Clear out existing content
            playlistTracks.appendChild(table);

            // Apply truncation styles
            table.style.width = '100%';
            table.querySelectorAll('td, th').forEach(cell => {
                cell.style.overflow = 'hidden';
                cell.style.textOverflow = 'ellipsis';
                cell.style.whiteSpace = 'nowrap';
                cell.style.paddingTop = '5px';
                cell.style.paddingBottom = '5px';
            });

            // Apply max-width to other columns except the first one
            table.querySelectorAll('th:not(:first-child), td:not(:first-child)').forEach(cell => {
                cell.style.maxWidth = '200px';  // Adjust this value as per your requirements
            });
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error fetching playlist details:", errorThrown);
        }
    });
}

function fetchUserLibrary() {
    $.ajax({
        url: 'https://api.spotify.com/v1/me/playlists',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function(response) {
            displayUserLibrary(response.items);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error fetching user playlists:", errorThrown);
        }
    });
}

let selectedPlaylistDiv = null;
let previousIcon = null;
let activePlaylistId;

function displayUserLibrary(playlists) {
    const libraryDiv = document.getElementById('library');
    playlists.forEach(playlist => {
        const playlistDiv = document.createElement('div');
        playlistDiv.className = 'flex justify-between items-center text-left w-full gap-2 mt-2 p-2 hover:bg-hover-custom cursor-pointer rounded'; 

        const imageUrl = playlist.images.length > 0 ? playlist.images[0].url : 'assets/default-image.png';

        playlistDiv.innerHTML = `
            <div class="flex items-center w-full gap-2">
                <img src="${imageUrl}" alt="Playlist Cover" class="w-14 h-14 rounded-md"> 
                <div class="flex flex-col w-11/12 truncate">
                    <h1 class="text-lg truncate">${playlist.name}</h1>
                    <small class="text-gray-500 truncate">${playlist.owner.display_name}</small>
                </div>
                <box-icon class="playlist-icon hidden" name='volume-full' color='#34fcff' size='28px'></box-icon>
            </div>
        `;

        playlistDiv.addEventListener('click', () => {
            playPlaylist(playlist.id);
        
            // Hide all box-icons
            document.querySelectorAll('.playlist-icon').forEach(icon => {
                icon.classList.add('hidden');
            });
        
            // Show the box-icon for the clicked playlist
            const clickedIcon = playlistDiv.querySelector('.playlist-icon');
            clickedIcon.classList.remove('hidden');
        
            // If there was a previously selected playlist, remove the accent color from its name and hover effects
            if (selectedPlaylistDiv) {
                selectedPlaylistDiv.classList.remove('bg-active-custom', 'text-accent-cyan', 'hover:bg-active-hover-custom');
                selectedPlaylistDiv.classList.add('hover:bg-hover-custom');
                const prevPlaylistName = selectedPlaylistDiv.querySelector('h1');
                prevPlaylistName.classList.remove('text-accent-cyan');
            }
        
            // Add the accent color to the current playlist's name and remove default hover
            const currentPlaylistName = playlistDiv.querySelector('h1');
            currentPlaylistName.classList.add('text-accent-cyan');
            playlistDiv.classList.remove('hover:bg-hover-custom');
            playlistDiv.classList.add('bg-active-custom', 'hover:bg-active-hover-custom');
        
            selectedPlaylistDiv = playlistDiv;
            previousIcon = clickedIcon;
        
            // Fetch and display the tracks and update the playlist details for the selected playlist
            populatePlaylistDetails(playlist.id, playlist.name, imageUrl, playlist.owner.display_name);
        });
        
        console.log("Active Playlist: ", activePlaylistId);
        if (playlist.id === activePlaylistId) {
            const playlistIcon = playlistDiv.querySelector('.playlist-icon');
            playlistIcon.classList.remove('hidden');

            const playlistName = playlistDiv.querySelector('h1');
            playlistName.classList.add('text-accent-cyan');
            playlistDiv.classList.remove('hover:bg-hover-custom');
            playlistDiv.classList.add('bg-active-custom', 'hover:bg-active-hover-custom');

            // Update the selectedPlaylistDiv and previousIcon variables
            selectedPlaylistDiv = playlistDiv;
            previousIcon = playlistIcon;
            
            console.log("Active Playlist: ", activePlaylistId);
        }

        libraryDiv.appendChild(playlistDiv);
    });
}


function playPlaylist(playlistId) {
    $.ajax({
        url: `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        type: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({ context_uri: `spotify:playlist:${playlistId}` }),
        success: function() {
            console.log("Successfully started playlist playback!");
        },
        error: function(error) {
            console.error("Error initiating playlist playback:", error);
        }
    });
}

function playSong(songUri) {
    $.ajax({
      url: `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      type: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({ uris: [songUri] }),
      success: function() {
        console.log("Successfully started song playback!");
      },
      error: function(error) {
        console.error("Error initiating song playback:", error);
      }
    });
}

let animationId;
const currentTimeElement = document.querySelector('.current-time');
const totalTimeElement = document.querySelector('.total-time');

function updateProgressBar() {
    player.getCurrentState().then(state => {
        if (state) {
            const percentage = (state.position / state.duration) * 100;
            document.querySelector('.progress-bar').style.width = `${percentage}%`;
            
            const formattedCurrentTime = formatTime(state.position);
            const formattedTotalTime = formatTime(state.duration);
            currentTimeElement.textContent = formattedCurrentTime;
            totalTimeElement.textContent = formattedTotalTime;

            // Call the next frame
            animationId = requestAnimationFrame(updateProgressBar);
        }
    });
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

document.querySelector('.progress-container').addEventListener('click', (e) => {
    const clickX = e.offsetX;
    const width = e.currentTarget.offsetWidth;
    const percentage = clickX / width;

    // Use getCurrentState() to get the duration
    player.getCurrentState().then(state => {
        if (state) {
            const seekPosition = state.duration * percentage;
            player.seek(seekPosition);
        }
    });
});

function initializeLoggedInUser() {

    // Fetch user profile and update display
    $.ajax({
        url: '/.netlify/functions/get_user_profile',
        xhrFields: {
            withCredentials: true
        },
        success: function(response) {
            const data = typeof response === 'string' ? JSON.parse(response) : response;
            updateProfile(data);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error fetching user profile:", errorThrown);
        }
    });

    $.ajax({
        url: '/.netlify/functions/get_access_token',
        xhrFields: {
        withCredentials: true
        },
        success: function(response) {
            const parsedResponse = JSON.parse(response);
            token = parsedResponse.access_token;

            fetchUserLibrary();
            // Initialize the Spotify Player
            player = new Spotify.Player({
                name: 'Better Spotify',
                getOAuthToken: cb => { cb(token); },
                volume: 0.2
            });

                // Initialize the volume icon state
                const slider = document.getElementById('volumeSlider');
                updateVolumeIcon(slider.value);

                // Set volume from slider (and set up the event listener)
                setVolumeFromSlider();

            // Add listeners to the player
            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
                deviceId = device_id;
                isPlayerReady = true;

                // For active device
                $.ajax({
                    url: 'https://api.spotify.com/v1/me/player',
                    type: 'PUT',
                    data: JSON.stringify({
                        device_ids: [device_id],
                        play: false // auto play
                    }),
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    success: function(response) {
                        console.log("Web app is now the active Spotify playback device!");
                    },
                    error: function(error) {
                        console.error("Error setting web app as active device:", error);
                    }
                });


                let isShuffled = false;

                document.getElementById('shuffleButton').addEventListener('click', function() {
                    isShuffled = !isShuffled;  // toggle the state

                    // Update the shuffle button image based on the local state
                    document.getElementById('shuffleButton').src = isShuffled ? 'assets/shuffleActive.png' : 'assets/shuffle.png';

                    // Use the Spotify Web API to set the shuffle state
                    $.ajax({
                        url: `https://api.spotify.com/v1/me/player/shuffle?state=${isShuffled}&device_id=${deviceId}`,
                        type: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        success: function() {
                            console.log("Successfully updated shuffle state!");
                        },
                        error: function(error) {
                            console.error("Error setting shuffle state:", error);
                        }
                    });
                });

                document.getElementById('backButton').addEventListener('click', function() {
                    if (player) {
                        player.previousTrack().catch(error => {
                            console.error("Error playing previous track:", error);
                        });
                    }
                });

                document.getElementById('playPauseCircle').onclick = function() {
                    player.togglePlay().catch(error => {
                        console.error("Error toggling playback:", error);
                    });
                
                    // Toggle the play/pause button image
                    var currentSrc = this.src;
                    if (currentSrc.includes('playCircle.png')) {
                        this.src = 'assets/pauseCircle.png';
                    } else {
                        this.src = 'assets/playCircle.png';
                    }
                };
                
                document.getElementById('forwardButton').addEventListener('click', function() {
                    if (player) {
                        player.nextTrack().catch(error => {
                            console.error("Error playing next track:", error);
                        });
                    }
                });
                
                let repeatMode = 'off';

                function handleRepeatOnce(state) {
                    if (state && state.position === 0 && state.paused && repeatMode === 'once') {
                        player.seek(0).then(function() {
                            player.resume();
                        }).catch(function(error) {
                            console.error("Error seeking to start of track:", error);
                        });
                    }
                }

                document.getElementById('RepeatButton').addEventListener('click', function() {
                    // Cycle through the repeat modes
                    if (repeatMode === 'off') {
                        repeatMode = 'context';
                    } else if (repeatMode === 'context') {
                        repeatMode = 'track';
                    } else if (repeatMode === 'track') {
                        repeatMode = 'once';
                    } else {
                        repeatMode = 'off';
                    }

                    // Update the repeat button image based on the local state
                    if (repeatMode === 'off') {
                        document.getElementById('RepeatButton').src = 'assets/repeat.png';
                    } else if (repeatMode === 'once') {
                        document.getElementById('RepeatButton').src = 'assets/repeatOne.png';
                    } else {
                        document.getElementById('RepeatButton').src = 'assets/repeatActive.png';
                    }

                    if (repeatMode !== 'once') {
                        // Remove the "repeat once" listener
                        player.removeListener('player_state_changed', handleRepeatOnce);

                        // Use the Spotify Web API to set the repeat mode
                        $.ajax({
                            url: `https://api.spotify.com/v1/me/player/repeat?state=${repeatMode}&device_id=${deviceId}`,
                            type: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            success: function() {
                                console.log("Successfully updated repeat mode!");
                            },
                            error: function(error) {
                                console.error("Error setting repeat mode:", error);
                            }
                        });
                    } else {
                        // Add the "repeat once" listener
                        player.addListener('player_state_changed', handleRepeatOnce);
                    }
                });

            });

            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });
            player.addListener('player_state_changed', state => {
                if (state && state.paused) {
                    document.getElementById('playPauseCircle').src = 'assets/playCircle.png';
                } else {
                    document.getElementById('playPauseCircle').src = 'assets/pauseCircle.png';
                }

                // Update the song card
                const songName = state.track_window.current_track.name;
                const artistName = state.track_window.current_track.artists[0].name;
                const songImage = state.track_window.current_track.album.images[0].url;
            
                document.querySelector('.song-name').textContent = songName;
                document.querySelector('.song-artist').textContent = artistName;
                document.querySelector('.song-image').src = songImage;

                // Extract the playlist ID if the song is playing from a playlist
                if (state && state.context && state.context.type === 'playlist') {
                    activePlaylistId = state.context.uri.split(":")[2];
                }

                // Update the progress bar
                if (state) {
                    if (!state.paused) {
                        // Start the loop when the song is playing
                        updateProgressBar();
                    } else {
                        // Stop the loop when the song is paused
                        cancelAnimationFrame(animationId);
                    }
                }
            });
            
            player.addListener('initialization_error', ({ message }) => {
                console.error("Initialization Error:", message);
            });
            player.addListener('authentication_error', ({ message }) => {
                console.error("Authentication Error:", message);
            });
            player.addListener('account_error', ({ message }) => {
                console.error("Account Error:", message);
            });
            
            // Connect the player
            player.connect().then(success => {
                if (success) {
                    console.log("Successfully connected to the player!");
                } else {
                    console.warn("Failed to connect to the player.");
                }
            }).catch(err => {
                console.error("Error connecting to the player:", err);
            });
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error fetching access token:", errorThrown);
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
        initializeLoggedInUser();
    });
} else {  // DOM is already loaded
    initializeLoggedInUser();
}
