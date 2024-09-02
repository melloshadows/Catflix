import { useState, useRef, useEffect } from 'react'
import './index.css'
import cat from './assets/cat2.jpg'
import newMovies from './newMovies'
import imdblogo from './assets/Imdb.png'
import rottenlogo from './assets/rotten.png'

function Got(){


    let[searched, setsearched] = useState()
    let[loading, setloading] = useState("none")
    let [apiimage, setapiimage] = useState(newMovies)
    let [ratings, setratings] = useState({});
    let input = useRef(null)
    let shown = useRef(null)
    let load = useRef(null)
    let rateloaded = useRef(false)
    let control = useRef(false)
    let [ratingsLoading, setRatingsLoading] = useState(true);


    async function Api() {
        setloading("flex")
        control.current = true
        const url = `https://streaming-availability.p.rapidapi.com/shows/search/title?country=us&title=${searched}&series_granularity=show&output_language=en&order_direction=desc`;
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '433cb8a5acmsh4957576df9677e2p1afb71jsn35033fe27e8c',
                'x-rapidapi-host': 'streaming-availability.p.rapidapi.com'
            }
        };

        try {
            const response = await fetch(url, options);

            if(!response){
                throw new error("the file was not fetched")
            }
            const result = await response.json();

            console.log(result);
            setapiimage(result);
            fetchRatings(result);
            
        } 
        catch (error) {
            console.error(error);
        }
    }   


    async function imdb(title) {
        const url = `https://www.omdbapi.com/?apikey=9f5c937d&t=${title}`;
        const options = {
            method: 'GET',
        };

        try {
            const response = await fetch(url, options);
            const data = await response.json();
            console.log(data)
            return {
                rating: data?.Ratings[0]?.Value || "N/A",
                rottenrating: data?.Ratings[1]?.Source == 'Rotten Tomatoes' ? data?.Ratings[1]?.Value : null,
                plot: data?.Plot || "Plot not available"
            };
            
        } catch (error) {
            console.error(error);
            return "N/A";
        }
    }


    async function gettrailer(blank){
        const url = `https://yt-api.p.rapidapi.com/search?query=${blank}`;
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '433cb8a5acmsh4957576df9677e2p1afb71jsn35033fe27e8c',
                'x-rapidapi-host': 'yt-api.p.rapidapi.com'
            }
        };

        try {
            const response = await fetch(url, options);
            const result = await response.json();
            return(result?.data[0]?.videoId)
        } catch (error) {
            console.error(error);
        }    
    }

    useEffect(() => {
        if (searched) {
            Api();
        }
    }, [searched]);
    
    useEffect(()=>{
        if(apiimage.length > 0){
            setloading("flex");
            preload()
        }
    },[apiimage,rateloaded.current])

    
    useEffect(()=>{
        window.addEventListener("keydown", enter)
       
        return() =>{
            window.removeEventListener("keydown", enter)
        }
    },[])


    async function fetchRatings(movies) {
        let newRatings = {};
        for (const movie of movies) {
            const title = movie.title;
            let cut = title.replace(/[-:]/g, '').replace(/\s+/g, '+')
            const details = await imdb(cut);
            newRatings[title] = details;
        }
        rateloaded.current = true
        console.log(newRatings)
        setratings(newRatings);
        setRatingsLoading(true)
    }

    

    async function playTrailer(res){
        let year = ""

        if(res.imdbrating){
            year = res.releaseYear
        }
        else{
            year = res?.showType === "series" ? res?.firstAirYear : res?.releaseYear
        }
        let trailer = `${res?.title} ${year}%20trailer`
        console.log(year)
        let cut = trailer.replaceAll(" ", "%20").replaceAll(":", "")
        console.log(cut)
        const videoid = await gettrailer(trailer.replaceAll(" ", "%20").replaceAll(":", ""));
        let link = `https://www.youtube.com/watch?v=${videoid}`
        window.open(link, "_blank");

    }

    

    function preload() {
        const imagePromises = apiimage.map((result, index) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => resolve(); 
                control.current == false ? img.src = newMovies[index].poster :
                img.src = result?.imageSet?.verticalPoster?.w720;
            });
        });
    
        Promise.all(imagePromises).then(() => {
            if (ratingsLoading) {
                setloading("none");
                document.body.style.overflow = "visible";
                shown.current.style.display = "flex";
            }
        });
    }

    const clicked = () =>{
        if(input.current.value === ""){
            alert("enter a movie")
        }
        else{
            setRatingsLoading(false)
            rateloaded.current = false
            setsearched(input.current.value)
            document.body.style.overflow = "hidden"
        }
    }
        
    const enter = (event) =>{
        if(event.key === "Enter"){
            console.log("enter clicked")
            clicked()
        }
    }

    function formatRuntime(res) {

        if(res?.imdbrating){
            return res.runtime          
        }
        else{
            const hours = Math.floor(res?.runtime / 60); 
            const remainingMinutes = res?.runtime % 60;
            return hours == 0 ? `${remainingMinutes}m` : `${hours}h ${remainingMinutes}m`
        }
    }
    
    function goToRottenTomatoes(e,res){
        let t 
        res?.showType === "series" ? t = "tv" : t = "m"
        let slug = e.target.alt.toLowerCase().replaceAll(" ", "_").replaceAll(":", "")
        let linkopen = `https://www.rottentomatoes.com/${t}/${slug}`;
        window.open(linkopen, "_blank");
    }
    

    const goToStreamingService = (e) =>{
        let linkopen = e.target.alt
        window.open(linkopen, "_blank");
    }

    function goToImdb(e){
        let linkopen = `https://www.imdb.com/title/${e.target.alt}/`
        window.open(linkopen, "_blank");
    }

    function airyear(sult){
        let p1 = ""

        sult?.firstAirYear === sult?.lastAirYear ? p1 = sult?.firstAirYear : p1 = `${sult?.firstAirYear}-${sult?.lastAirYear}`

        return(p1)
        
    }

    function assignYear(title){
        return title?.showType === "movie" ? title?.releaseYear : airyear(title)

    }
    
    function dropshad(e, res){
        e.currentTarget.style.filter = `drop-shadow(0 0 12px gray)`

        if(res.backdrop){
            e.currentTarget.style.filter = `drop-shadow(0 0 20px ${res.backdrop})`
        }
        else if(res?.streamingOptions?.us[0]?.service?.id){
            if(res?.streamingOptions?.us[0]?.service?.id === "apple")
                e.currentTarget.style.filter = `drop-shadow(0 0 10px white)`

            else if (res?.streamingOptions?.us[0]?.service?.id === "peacock")
                e.currentTarget.style.filter = `drop-shadow(0 0 10px gold)`

            else
                e.currentTarget.style.filter = `drop-shadow(0 0 10px ${res?.streamingOptions?.us[0]?.service?.themeColorCode})`;                
        }
    }

    
    function removedropshad(e){
        e.currentTarget.style.filter = "none";
    }


    return(
        <>  
            <div className='logo'>
                <img src={cat} />
                <h1>Catflix+</h1>
            </div>
                <br /><br /><br /><br /><br />
            <div className='search'>
                <input ref={input} type="text" placeholder='type a movie or show'/>
                <button onClick={clicked}>search</button>
            </div>
           
            <div style={{display : loading}} ref={load} className='test'>
                <div className='row1'>
                    <div className='sq1'></div>
                    <div className='sq2'></div>
                </div>
                <div className='row2'>
                    <div className='sq3'></div>
                    <div className='sq4'></div>
                </div>    
            </div>

            <div ref={shown} className='shown'>
            {apiimage.map((result)=>(
                result?.imageSet?.verticalPoster?.w720 && result?.overview || result.imdbrating ?(
                
                <div 
                    onMouseOut={(e) => removedropshad(e)} 
                    onMouseOver={(e) => dropshad(e, result)} 
                    className='photos' 
                    key={result.id||result.title}>
                    
                    <img className='poster' src={result?.imageSet?.verticalPoster?.w720 || result.poster} alt = "A photo that didn't load" />
                        
                        <div className='info'>
                            <h1>{result?.imageSet ? `${result?.title}: ${assignYear(result)}` : `${result?.title}: ${result?.releaseYear}`} </h1>
                            
                            <div onClick={() => playTrailer(result)} className='trailer-container'>
                                <div className='play-icon'></div>
                                <h3 className='trailer'>Watch Trailer</h3>
                            </div>

                            <p className='rating'><strong>Rate:   </strong>
                                <div className='imdbrating'>
                                    <img className='imdb' src={imdblogo} onClick={(e)=>goToImdb(e)} alt = {result?.imdbId} />  
                                    <p>{ratings[result?.title]?.rating || result.imdbrating || "Loading..."}</p>
                                </div>
                                
                                <div className='rottenrating'>
                                    {ratings[result?.title]?.rottenrating || result.rottenrating ? 
                                        <img src={rottenlogo} className='rotten' alt={result?.title} onClick={(e)=>goToRottenTomatoes(e,result)} /> 
                                    : null}
                                    <p> {ratings[result?.title]?.rottenrating || result.rottenrating} </p>
                                </div>
                            </p>
                            
                            <p><strong>Runtime: </strong> 
                                {result?.runtime ? formatRuntime(result) : result?.seasonCount + " seasons"}
                            </p>
                            
                            {result?.showType === "series" || result.episodeCount ? 
                                <p>
                                    <strong>Episode Count: </strong> 
                                    {result?.episodeCount }
                                </p> 
                            : null}
                            
                            <p><strong>Cast: </strong> {result.stars ? result.stars : `${result?.cast[0]}, ${result?.cast[1]}, ${result?.cast[2]}`}</p>
                            
                            <p><strong>Directors: </strong>  {result?.directors ? result?.directors : result?.creators}</p>
                            
                            {result?.streamingOptions?.us ? (
                                <p><strong>Available on: &nbsp;</strong> {result?.streamingOptions?.us.length > 0 ?
                                    <>
                                    <img className='streaming-service' 
                                        onClick={(e) => goToStreamingService(e)} 
                                        src={result?.streamingOptions?.us[0]?.service?.imageSet?.darkThemeImage} 
                                        alt={result?.streamingOptions?.us[0]?.link}/>            
                                    </>
                                    : "Not Available"
                                }
                             </p>
                            ): null
                            }
                           
                           {result?.imdbrating ? (
                                <p className='ava'><strong>Available on: &nbsp;</strong> 
                                    <img className='streaming-service' 
                                        src={result?.streamingOptions} />            
                                </p>
                           ) : null}
                            
                            <p className='overview'><strong>Overview:</strong> {ratings[result?.title]?.plot || result.plot}</p>

                        </div>
                </div>
                ): null
            ) ) }
            </div>
        </>
    )
}

export default Got