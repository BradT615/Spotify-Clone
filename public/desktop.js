// Desktop js

document.getElementById("loading-screen").style.display = "none";
document.getElementById("loggedin").style.display = "flex";

let token;
let isPlayerReady = false;

function updateProfile(data) {
    let imageUrl = data.images.length > 0 ? data.images[0].url : 'assets/default-image.png';
    document.getElementById('user-name').textContent = data.display_name;
    document.querySelectorAll('.user-image').forEach(img => img.src = imageUrl);
    document.getElementById('profileLink').href = `https://open.spotify.com/user/${data.id}`;
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

let selectedRow;

function populatePlaylistDetails(playlistId, playlistName, playlistImageURL, playlistOwnerName) {
    $.ajax({
        url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function(response) {
            // Update playlist image, name, and owner
            const playlistContainer = document.querySelector('.playlist-container');
            playlistContainer.classList.add('overflow-y-auto');
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
            table.classList.add('text-left', 'playlist-table', 'w-full', 'box-border');
            
            let thead = document.createElement('thead');
            thead.classList.add('sticky', 'top-0', 'z-10', 'bg-bg-custom', 'bg-table-header', 'min-w-full', 'box-border');

            let tr = document.createElement('tr');

            ['#', 'Title', 'Album', 'Date added', 'Time'].forEach((header, index) => {
                let th = document.createElement('th');
                th.classList.add('m-0');
                th.textContent = header;
            
                if (header === '#') {
                    th.classList.add('pl-6');
                }
                if (header === 'Date added') {
                    th.classList.add('hidden', 'lg:table-cell');
                }
                if (header === 'Album') {
                    th.classList.add('hidden', 'md:table-cell');
                }
                if (header === 'Time') {
                    th.classList.add('relative', 'pr-3', 'bg-table-header');
                    let overlay = document.createElement('div');
                    overlay.classList.add('absolute', 'top-0', 'bottom-0', 'w-2.5', 'bg-table-header', 'z-10');
                    overlay.style.right = '-10px';
                    th.appendChild(overlay);
                }
            
                tr.appendChild(th);
            });            

            thead.appendChild(tr);
            table.appendChild(thead);

            let tbody = document.createElement('tbody');

            // Populate table rows with data
            response.items.forEach((item, index) => {
                let tr = document.createElement('tr');
                tr.classList.add('m-0', 'hover:bg-hover-custom', 'rounded-md');

                // Adding click event listener to play the song when the row is clicked
                tr.addEventListener('click', () => {
                    playSong(`spotify:track:${item.track.id}`);
                    
                    // previously selected row
                    if (selectedRow) {
                        selectedRow.classList.remove('bg-active-hover-custom');
                        selectedRow.classList.add('hover:bg-hover-custom');
                        const prevSongName = selectedRow.querySelector('span');
                        prevSongName.classList.remove('text-accent-cyan');
                    }
                    
                    // Add the active styles to the clicked row
                    tr.classList.add('bg-active-hover-custom');
                    tr.classList.remove('hover:bg-hover-custom');
                    const currentSongName = tr.querySelector('span');
                    currentSongName.classList.add('text-accent-cyan');
                    
                    // Update the selectedRow
                    selectedRow = tr;
                });


                // #
                let tdNumber = document.createElement('td');
                tdNumber.textContent = index + 1;
                tdNumber.classList.add('pl-6');
                tr.appendChild(tdNumber);

                // Title (image + name)
                let tdTitle = document.createElement('td');
                let wrapperDiv = document.createElement('div');
                wrapperDiv.classList.add('flex', 'items-center', 'w-full');

                let img = document.createElement('img');
                img.src = item.track.album.images.length > 0 ? item.track.album.images[0].url : 'assets/default-image.png';
                img.alt = item.track.name;
                img.classList.add('w-14', 'mr-2.5');

                let span = document.createElement('span');
                span.textContent = item.track.name;
                span.classList.add('flex-grow', 'overflow-hidden', 'whitespace-nowrap', 'truncate', 'font-bold', 'pr-2.5');

                wrapperDiv.appendChild(img);
                wrapperDiv.appendChild(span);
                tdTitle.appendChild(wrapperDiv);
                tr.appendChild(tdTitle);

                // Album
                let tdAlbum = document.createElement('td');
                tdAlbum.textContent = item.track.album.name;
                tdAlbum.classList.add('pr-2.5', 'hidden', 'md:table-cell');
                tr.appendChild(tdAlbum);

                // Date added
                let tdDateAdded = document.createElement('td');
                let dateAdded = new Date(item.added_at).toLocaleDateString();
                tdDateAdded.textContent = dateAdded;
                tdDateAdded.classList.add('hidden', 'lg:table-cell');
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

            table.classList.add('w-full');
            table.querySelectorAll('td, th').forEach(cell => {
                cell.classList.add('overflow-hidden', 'truncate', 'whitespace-nowrap', 'py-1.5', 'box-border');
            });

            // Apply max-width to other columns except the first one
            table.querySelectorAll('th:not(:first-child), td:not(:first-child)').forEach(cell => {
                cell.classList.add('max-w-[200px]');
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

            // Extract the top 6 playlists and pass to displayTopPlaylists function
            const topPlaylists = response.items.slice(0, 6);
            displayTopPlaylists(topPlaylists);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error fetching user playlists:", errorThrown);
        }
    });
    fetchTopSongs();
    fetchTopArtists();
}

let previousPlayButtonImage = null;

function displayTopPlaylists(topPlaylists) {
    // Get the top-playlists container
    const topPlaylistsContainer = document.querySelector('#top-playlists');
    topPlaylistsContainer.innerHTML = ''; // Clear existing content

    // Populate the top-playlists section with the top 6 playlists
    topPlaylists.forEach(playlist => {
        const playlistDiv = document.createElement('div');
        playlistDiv.className = 'playlist-item group bg-hover-custom hover:bg-active-custom shadow rounded-md flex items-center relative';

        const playlistImageContainer = document.createElement('div');
        const playlistImage = document.createElement('img');
        playlistImage.src = playlist.images.length > 0 ? playlist.images[0].url : 'assets/default-image.png';
        playlistImage.alt = `${playlist.name} cover image`;
        playlistImage.className = 'rounded-l-lg w-20 h-20 object-cover';
        playlistImageContainer.appendChild(playlistImage);

        const playlistTextContainer = document.createElement('div');
        playlistTextContainer.className = 'w-1/2';
        const playlistName = document.createElement('h2');
        playlistName.textContent = playlist.name;
        playlistName.className = 'text-lg font-bold text-left p-2 line-clamp-2 overflow-hidden';
        playlistTextContainer.appendChild(playlistName);

        // Creating play button div and image element
        const playButtonDiv = document.createElement('div');
        playButtonDiv.className = 'absolute top-1/2 right-2 transform -translate-y-1/2 hidden group-hover:block';
        const playButtonImage = document.createElement('img');
        playButtonImage.src = 'assets/bluePlay.png';
        playButtonImage.className = 'w-14 transition-transform transform origin-center hover:scale-110';
        playButtonImage.alt = 'play/pause';
        playButtonDiv.appendChild(playButtonImage);

        playlistDiv.appendChild(playlistImageContainer);
        playlistDiv.appendChild(playlistTextContainer);
        playlistDiv.appendChild(playButtonDiv);

        topPlaylistsContainer.appendChild(playlistDiv);

        // Adding click event listener to the play button
        playButtonDiv.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevents triggering the playlistDiv click event
            playPlaylist(playlist.id);
            
            // Revert the previous play button to a play button if exists
            if (previousPlayButtonImage && previousPlayButtonImage !== playButtonImage) {
                previousPlayButtonImage.src = 'assets/bluePlay.png';
                previousPlayButtonImage.parentElement.classList.add('hidden', 'group-hover:block');
            }

            // Toggle the play button image
            if (playButtonImage.src.endsWith('bluePlay.png')) {
                playButtonImage.src = 'assets/bluePause.png';
                playButtonDiv.classList.remove('hidden', 'group-hover:block');
                previousPlayButtonImage = playButtonImage; // Set this as the previous play button
            } else {
                player.togglePlay().catch(error => {
                    console.error("Error toggling playback:", error);
                });
                
                playButtonImage.src = 'assets/bluePlay.png';
                playButtonDiv.classList.add('hidden', 'group-hover:block');
                previousPlayButtonImage = null; // Reset the previous play button
            }
        });

        // Adding click event listener to play the playlist and populate details when the item is clicked
        playlistDiv.addEventListener('click', () => {
            playPlaylist(playlist.id);
            document.getElementById('home-screen').classList.add('hidden');
            document.getElementById('artist-details').classList.add('hidden');
            document.getElementById('search-results').classList.add('hidden');
            document.getElementById('playlist-details').classList.remove('hidden');

            // Calling populatePlaylistDetails function with necessary parameters
            populatePlaylistDetails(playlist.id, playlist.name, playlist.images[0]?.url, playlist.owner.display_name);
        });
    });
}

function fetchTopSongs() {
    $.ajax({
        url: 'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=4',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function(response) {
            const topSongsContainer = document.querySelector('#top-songs');
            topSongsContainer.innerHTML = ''; // Clear existing content

            // Populate the top-songs section with the top songs
            response.items.forEach((song, index) => {
                const songDiv = document.createElement('div');
                songDiv.className = 'song-item bg-hover-custom hover:bg-active-custom shadow rounded-md flex' +
                (index === 3 ? ' lg:hidden xl:block' : '');

                const songDetailContainer = document.createElement('div');
                songDetailContainer.className = 'w-full flex flex-col p-4 gap-4';

                const songImage = document.createElement('img');
                songImage.src = song.album.images.length > 0 ? song.album.images[0].url : 'assets/default-image.png';
                songImage.alt = `${song.name} cover image`;
                songImage.className = 'w-38 rounded-md shadow-md';
                songDetailContainer.appendChild(songImage);

                const songName = document.createElement('h2');
                songName.textContent = song.name;
                songName.className = 'text-xl font-bold text-left truncate pr-1';
                songDetailContainer.appendChild(songName);

                const songArtist = document.createElement('p');
                songArtist.textContent = song.artists.map(artist => artist.name).join(', ');
                songArtist.className = 'text-md text-gray-500 text-left truncate pr-1';
                songDetailContainer.appendChild(songArtist);

                songDiv.appendChild(songDetailContainer);
                topSongsContainer.appendChild(songDiv);

                // Adding click event listener to play the song when the item is clicked
                songDiv.addEventListener('click', () => {
                    playSong(`spotify:track:${song.id}`);
                });
            });
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error fetching top songs:", errorThrown);
        }
    });
}

function fetchTopArtists() {
    $.ajax({
        url: 'https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=4',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function(response) {
            const topArtistsContainer = document.querySelector('#top-artists');
            topArtistsContainer.innerHTML = ''; // Clear existing content

            // Populate the top-artists section with the top artists
            response.items.forEach((artist, index) => {
                const artistDiv = document.createElement('div');
                artistDiv.className = 'artist-item bg-hover-custom hover:bg-active-custom shadow rounded-md flex' +
                (index === 3 ? ' lg:hidden xl:block' : '');

                const artistDetailContainer = document.createElement('div');
                artistDetailContainer.className = 'w-full flex flex-col p-4 gap-4';

                const artistImage = document.createElement('img');
                artistImage.src = artist.images.length > 0 ? artist.images[0].url : 'assets/default-image.png';
                artistImage.alt = `${artist.name} cover image`;
                artistImage.className = 'w-38 rounded-full shadow-md';
                artistDetailContainer.appendChild(artistImage);

                const artistName = document.createElement('h2');
                artistName.textContent = artist.name;
                artistName.className = 'text-xl font-bold text-left truncate pr-1';
                artistDetailContainer.appendChild(artistName);

                artistDiv.appendChild(artistDetailContainer);
                topArtistsContainer.appendChild(artistDiv);

                // Adding click event listener to show artist details when the item is clicked
                artistDiv.addEventListener('click', () => {
                    fetchAndDisplayArtistDetails(artist);
                });
            });
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error fetching top artists:", errorThrown);
        }
    });
}

function fetchAndDisplayArtistDetails(artist) {
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('playlist-details').classList.add('hidden');
    document.getElementById('search-results').classList.add('hidden');
    document.getElementById('artist-details').classList.remove('hidden');

    // Populate artist details section with data from clicked artist
    document.getElementById('artist-image').src = artist.images.length > 0 ? artist.images[0].url : 'assets/default-image.png';
    document.getElementById('artist-name').textContent = artist.name;

    // Fetch and display the top songs of the artist
    $.ajax({
        url: `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`,
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function (response) {
            const artistSongsContainer = document.getElementById('artist-albums');
            artistSongsContainer.innerHTML = ''; // Clear existing content

            // Create table and headers
            let table = document.createElement('table');
            table.classList.add('text-left', 'w-full', 'box-border');

            let thead = document.createElement('thead');
            thead.classList.add('sticky', 'top-0', 'z-10', 'bg-bg-custom', 'bg-table-header', 'min-w-full', 'box-border');

            let tr = document.createElement('tr');

            ['#', 'Title', 'Album', 'Time'].forEach((header, index) => {
                let th = document.createElement('th');
                th.classList.add('m-0');
                th.textContent = header;

                if (header === '#') {
                    th.classList.add('pl-6');
                }
                if (header === 'Album') {
                    th.classList.add('hidden', 'md:table-cell');
                }
                if (header === 'Time') {
                    th.classList.add('relative', 'pr-3', 'bg-table-header');
                    let overlay = document.createElement('div');
                    overlay.classList.add('absolute', 'top-0', 'bottom-0', 'w-2.5', 'bg-table-header', 'z-10');
                    overlay.style.right = '-10px';
                    th.appendChild(overlay);
                }

                tr.appendChild(th);
            });

            thead.appendChild(tr);
            table.appendChild(thead);

            let tbody = document.createElement('tbody');

            // Populate table rows with data
            response.tracks.forEach((item, index) => {
                let tr = document.createElement('tr');
                tr.classList.add('m-0', "rounded-md", 'hover:bg-hover-custom');

                // Adding click event listener to play the song when the row is clicked
                tr.addEventListener('click', () => {
                    playSong(`spotify:track:${item.id}`);

                    // previously selected row
                    if (selectedSearchRow) {
                        selectedSearchRow.classList.remove('bg-active-hover-custom');
                        selectedSearchRow.classList.add('hover:bg-hover-custom');
                        const prevSongName = selectedSearchRow.querySelector('span');
                        prevSongName.classList.remove('text-accent-cyan');
                    }

                    // Add the active styles to the clicked row
                    tr.classList.add('bg-active-hover-custom');
                    tr.classList.remove('hover:bg-hover-custom');
                    const currentSongName = tr.querySelector('span');
                    currentSongName.classList.add('text-accent-cyan');

                    // Update the selectedSearchRow
                    selectedSearchRow = tr;
                });

                // #
                let tdNumber = document.createElement('td');
                tdNumber.textContent = index + 1;
                tdNumber.classList.add('pl-6');
                tr.appendChild(tdNumber);

                // Title (image + name)
                let tdTitle = document.createElement('td');
                let wrapperDiv = document.createElement('div');
                wrapperDiv.classList.add('flex', 'items-center', 'w-full');

                let img = document.createElement('img');
                img.src = item.album.images.length > 0 ? item.album.images[0].url : 'assets/default-image.png';
                img.alt = item.name;
                img.classList.add('w-14', 'mr-2.5');

                let span = document.createElement('span');
                span.textContent = item.name;
                span.classList.add('flex-grow', 'overflow-hidden', 'whitespace-nowrap', 'truncate', 'font-bold', 'pr-2.5');

                wrapperDiv.appendChild(img);
                wrapperDiv.appendChild(span);
                tdTitle.appendChild(wrapperDiv);
                tr.appendChild(tdTitle);

                // Album
                let tdAlbum = document.createElement('td');
                tdAlbum.textContent = item.album.name;
                tdAlbum.classList.add('pr-2.5', 'hidden', 'md:table-cell');
                tr.appendChild(tdAlbum);

                // Time
                let tdTime = document.createElement('td');
                let minutes = Math.floor(item.duration_ms / 60000);
                let seconds = Math.floor((item.duration_ms % 60000) / 1000);
                let time = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
                tdTime.textContent = time;
                tr.appendChild(tdTime);

                tbody.appendChild(tr);
            });

            table.appendChild(tbody);
            artistSongsContainer.appendChild(table);

            table.classList.add('w-full');
            table.querySelectorAll('td, th').forEach(cell => {
                cell.classList.add('overflow-hidden', 'truncate', 'whitespace-nowrap', 'py-1.5', 'box-border');
            });

            // Apply max-width to other columns except the first one
            table.querySelectorAll('th:not(:first-child), td:not(:first-child)').forEach(cell => {
                cell.classList.add('max-w-[200px]');
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error("Error fetching top songs of the artist:", errorThrown);
        }
    });
}

document.getElementById('search-input').addEventListener('input', handleSearchQuery);

function handleSearchQuery(event) {
    const query = event.target.value;

    if (query.length > 0) {
        // Call the Spotify API to get the search results
        $.ajax({
            url: `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function(response) {
                // Call displaySearchResults function with the response
                displaySearchResults(response);
            },
            error: function(error) {
                console.error("Error fetching search results:", error);
            }
        });
    } else {
        // If the query is empty, clear the search results
        document.getElementById('search-results-content').innerHTML = '';
    }
}

let selectedSearchRow;

function displaySearchResults(response) {
    const resultsContent = document.getElementById('search-results-content');
    resultsContent.innerHTML = ''; // Clear any previous results

    const results = response.tracks.items;

    if (!Array.isArray(results)) {
        console.error('Results is not an array:', results);
        return;
    }

    // Create table and headers
    let table = document.createElement('table');
    table.classList.add('text-left', 'w-full', 'box-border');
    
    let thead = document.createElement('thead');
    thead.classList.add('sticky', 'top-0', 'z-10', 'bg-bg-custom', 'bg-table-header', 'min-w-full', 'box-border');

    let tr = document.createElement('tr');

    ['#', 'Title', 'Album', 'Time'].forEach((header, index) => {
        let th = document.createElement('th');
        th.classList.add('m-0');
        th.textContent = header;
    
        if (header === '#') {
            th.classList.add('pl-6');
        }
        if (header === 'Album') {
            th.classList.add('hidden', 'md:table-cell');
        }
        if (header === 'Time') {
            th.classList.add('relative', 'pr-3', 'bg-table-header');
            let overlay = document.createElement('div');
            overlay.classList.add('absolute', 'top-0', 'bottom-0', 'w-2.5', 'bg-table-header', 'z-10');
            overlay.style.right = '-10px';
            th.appendChild(overlay);
        }
    
        tr.appendChild(th);
    });            

    thead.appendChild(tr);
    table.appendChild(thead);

    let tbody = document.createElement('tbody');

    // Populate table rows with data
    results.forEach((item, index) => {
        let tr = document.createElement('tr');
        tr.classList.add('m-0', "rounded-md", 'hover:bg-hover-custom');

        // Adding click event listener to play the song when the row is clicked
        tr.addEventListener('click', () => {
            playSong(`spotify:track:${item.id}`);
        
            // previously selected row
            if (selectedSearchRow) {
                selectedSearchRow.classList.remove('bg-active-hover-custom');
                selectedSearchRow.classList.add('hover:bg-hover-custom');
                const prevSongName = selectedSearchRow.querySelector('span');
                prevSongName.classList.remove('text-accent-cyan');
            }
        
            // Add the active styles to the clicked row
            tr.classList.add('bg-active-hover-custom');
            tr.classList.remove('hover:bg-hover-custom');
            const currentSongName = tr.querySelector('span');
            currentSongName.classList.add('text-accent-cyan');
        
            // Update the selectedSearchRow
            selectedSearchRow = tr;
        });        

        // #
        let tdNumber = document.createElement('td');
        tdNumber.textContent = index + 1;
        tdNumber.classList.add('pl-6');
        tr.appendChild(tdNumber);

        // Title (image + name)
        let tdTitle = document.createElement('td');
        let wrapperDiv = document.createElement('div');
        wrapperDiv.classList.add('flex', 'items-center', 'w-full');

        let img = document.createElement('img');
        img.src = item.album.images.length > 0 ? item.album.images[0].url : 'assets/default-image.png';
        img.alt = item.name;
        img.classList.add('w-14', 'mr-2.5');

        let span = document.createElement('span');
        span.textContent = item.name;
        span.classList.add('flex-grow', 'overflow-hidden', 'whitespace-nowrap', 'truncate', 'font-bold', 'pr-2.5');

        wrapperDiv.appendChild(img);
        wrapperDiv.appendChild(span);
        tdTitle.appendChild(wrapperDiv);
        tr.appendChild(tdTitle);

        // Album
        let tdAlbum = document.createElement('td');
        tdAlbum.textContent = item.album.name;
        tdAlbum.classList.add('pr-2.5', 'hidden', 'md:table-cell');
        tr.appendChild(tdAlbum);

        // Time
        let tdTime = document.createElement('td');
        let minutes = Math.floor(item.duration_ms / 60000);
        let seconds = Math.floor((item.duration_ms % 60000) / 1000);
        let time = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
        tdTime.textContent = time;
        tr.appendChild(tdTime);

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    resultsContent.appendChild(table);

    table.classList.add('w-full');
    table.querySelectorAll('td, th').forEach(cell => {
        cell.classList.add('overflow-hidden', 'truncate', 'whitespace-nowrap', 'py-1.5', 'box-border');
    });

    // Apply max-width to other columns except the first one
    table.querySelectorAll('th:not(:first-child), td:not(:first-child)').forEach(cell => {
        cell.classList.add('max-w-[200px]');
    });
}

let selectedPlaylistDiv = null;
let previousIcon = null;
let activePlaylistId;

function displayUserLibrary(playlists) {
    const libraryDiv = document.getElementById('library');
    const libraryHeader = document.getElementById('library-header');

    libraryDiv.addEventListener('scroll', function() {
        if (libraryDiv.scrollTop > 0) {
            libraryHeader.classList.add('custom-shadow');
        } else {
            libraryHeader.classList.remove('custom-shadow');
        }
    });

    playlists.forEach(playlist => {
        const playlistDiv = document.createElement('div');
        playlistDiv.className = 'flex justify-between items-center text-left w-full p-2 py-3 hover:bg-hover-custom cursor-pointer rounded-lg'; 

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

            // Hide home screen and show playlist details
            document.getElementById('home-screen').classList.add('hidden');
            document.getElementById('artist-details').classList.add('hidden');
            document.getElementById('search-results').classList.add('hidden');
            document.getElementById('playlist-details').classList.remove('hidden');
        
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

function toggleDropdown() {
    document.getElementById('dropdownMenu').classList.toggle('hidden');
}

function handleLogoutClick() {
    console.log('Inline logout handler called');
    if (player) {
        player.disconnect();
    }
    deleteUser();
}

document.addEventListener('click', (event) => {
    const dropdownMenu = document.getElementById('dropdownMenu');
    const userImage = document.getElementById('userImage');

    if (!userImage.contains(event.target)) {
        dropdownMenu.classList.add('hidden');
    }
});

document.getElementById('search-button').addEventListener('click', function() {
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('artist-details').classList.add('hidden');
    document.getElementById('playlist-details').classList.add('hidden');
    document.getElementById('search-results').classList.remove('hidden');
    // Set focus to the search input
    document.getElementById('search-input').focus();
});

document.getElementById('home-button').addEventListener('click', function() {
    document.getElementById('home-screen').classList.remove('hidden');
    document.getElementById('artist-details').classList.add('hidden');
    document.getElementById('playlist-details').classList.add('hidden');
    document.getElementById('search-results').classList.add('hidden');
});

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

document.getElementById('userImage').addEventListener('click', (event) => {
    event.stopPropagation();
    toggleDropdown();
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
