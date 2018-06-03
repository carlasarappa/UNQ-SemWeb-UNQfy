
const picklejs = require('picklejs');
const Promise = require('bluebird');
const fs = require('fs'); // necesitado para guardar/cargar unqfy
const model = require('./model/model');
const spotify = require('./spotify');
const musixmatch = require('./musixmatch');


class UNQfy {
  constructor() {
    this.repository = new model.Repository();
  }
   
  getTracksMatchingGenres(genres) {
    // Debe retornar todos los tracks que contengan alguno de los generos en el parametro genres

    return this.repository.filterTracksBy('genre', genres);
  }

  getTracksMatchingArtist(artistName) {
    let artist = this.getArtistByName(artistName);
   
    return artist.albums.reduce((accumulator, album) => accumulator.concat(album.tracks), []);
  }

  /* Debe soportar al menos:
     params.name (string)
     params.country (string)
  */
  addArtist(params) {
    // El objeto artista creado debe soportar (al menos)
    // las propiedades name (string) y country (string)
    if (params.name === "") throw "El nombre del artista no debe ser vacio";

    const artist = new model.Artist(params.name, params.country);
    this.repository.addArtist(artist);
    return artist;
  }


  /* Debe soportar al menos:
      params.name (string)
      params.year (number)
  */
  addAlbum(artistName, params) {
    // El objeto album creado debe tener (al menos) las propiedades name (string) y year
    const artist = this.getArtistByName(artistName);
    if (! artist) throw "No existe el artista " + artistName;
    artist.albums.push(new model.Album(params.name, params.year));
  }


  /* Debe soportar (al menos):
       params.name (string)
       params.duration (number)
       params.genres (lista de strings)
  */
  addTrack(albumName, params) {
    /* El objeto track creado debe soportar (al menos) las propiedades:
         name (string),
         duration (number),
         genres (lista de strings)
    */
    const album = this.getAlbumByName(albumName);
    if (!album) throw "No existe el album " + albumName;
    console.log(album);
    album.tracks.push(new model.Track(params.name, params.duration, params.genre));
  }

  getArtists(){
    return this.repository.getArtists();
  }

  getArtistByName(name) {
    const artist = this.repository.artists.find(artist => name == artist.name);
    if(!artist) throw "No se encontro el artista " + name;
    return artist;
  }

  getArtistById(id){
    return this.repository.findArtistById(id)[0];
  }

  removeArtist(id){
    const artist = this.repository.findArtistById(id);
    if (!artist || artist.length === 0) {
      throw { message: 'Artist does not exist' };
    }
    this.repository.removeArtist(id);
  }

  getAlbums(){
    return this.repository.getAlbums();
  }


  getAlbumByName(name) {
    const album = this.repository.getAlbums().find(album => name === album.name);
    if(!album) throw "No se encontro el album " + name;
    return album;
  }

  getTrackByName(name) {
    const track = this.repository.getTracks().find(track => name === track.name);

    if(!track) throw "No se encontro el track " + name;
    return track;
  }

  getPlaylistByName(name) {
    const playlist = this.repository.playlists.find(playlist => name == playlist.name);
    if(!playlist) throw "No se encontro la playlist " + name;
    return playlist;
  }

  addPlaylist(name, genresToInclude, maxDuration) {
    /* El objeto playlist creado debe soportar (al menos):
      * una propiedad name (string)
      * un metodo duration() que retorne la duración de la playlist.
      * un metodo hasTrack(aTrack) que retorna true si aTrack se encuentra en la playlist
    */
    const playlist = new model.Playlist(name, maxDuration);
    const tracksDisponibles = this.getTracksMatchingGenres(genresToInclude);
    playlist.selectAndAddTracks(tracksDisponibles, playlist.maxDuration);
    this.repository.playlists.push(playlist);
  }

  populateAlbumsForArtist(artistName){
    const spoty = new spotify.Spotify();

    return spoty.getAlbumsForArtistName(artistName)
      .then( albums => {
        albums.map( album => this.addAlbum(artistName, 
          { 
            name: album.name, 
            year: album.release_date 
          }));
      });
  }

  getLyricsForTrack(trackName){
    const track = this.getTrackByName(trackName);
    const musix = new musixmatch.Musixmatch();

    if (!track.lyrics){
      return musix.getLyricsFromTrackName(trackName)
        .then(lyrics => {
          track.lyrics = lyrics;
          return lyrics;
        });
    }
    
    return Promise.resolve(track.lyrics);
  }

  
  
  save(filename = 'unqfy.json') {
    new picklejs.FileSerializer().serialize(filename, this);
  }

  static load(filename = 'unqfy.json') {
    const fs = new picklejs.FileSerializer();
    // TODO: Agregar a la lista todas las clases que necesitan ser instanciadas
    const classes = [UNQfy, model.Album, model.Track, model.Artist, model.Repository, model.Playlist];
    fs.registerClasses(...classes);
    
    return fs.load(filename);
  }
}

function getUNQfy() {

  const filename = 'estado';
  let unqfy = new UNQfy();
  
  if (fs.existsSync(filename)) {
    unqfy = UNQfy.load(filename);
  }
  return unqfy;
}

// TODO: exportar todas las clases que necesiten ser utilizadas desde un modulo cliente
module.exports = {
  UNQfy,
  getUNQfy
};

