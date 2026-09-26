import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Play, RotateCcw } from 'lucide-react';

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const createVehicleIcon = (color: string, shadow: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px ${shadow};"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const createPulseIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="width: 20px; height: 20px; position: relative;">
            <div style="position: absolute; inset: 0; background-color: ${color}; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></div>
            <div style="position: relative; width: 10px; height: 10px; top: 5px; left: 5px; background-color: ${color}; border-radius: 50%; border: 2px solid white; shadow: 0 0 8px ${color}"></div>
           </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const defaultVehicleIcon = createVehicleIcon('#5C4A42', 'rgba(92,74,66,0.3)'); // Brand Roasted
const heroVehicleIcon = createVehicleIcon('#D9735A', 'rgba(217,115,90,0.6)');   // Brand Terracotta

// Farm & City Constants
const ZP_CENTER: [number, number] = [47.8388, 35.1396];
const FARM_LOCATION: [number, number] = [47.8550, 35.1200];

// Realistic road segments in Zaporizhzhia to snap vehicles to
export const ZP_ROUTES: [number, number][][] = [[[47.849941,35.128932],[47.849883,35.129043],[47.849513,35.129697],[47.849284,35.130159],[47.849005,35.130654],[47.848745,35.131133],[47.848512,35.13152],[47.848382,35.131749],[47.848146,35.1322],[47.847909,35.132642],[47.847841,35.132779],[47.847363,35.133006],[47.846945,35.133077],[47.84663,35.133247],[47.846512,35.133418],[47.846371,35.13369],[47.846271,35.133744],[47.846219,35.133757],[47.846146,35.133736],[47.845399,35.132901],[47.84494,35.132342],[47.844065,35.131272],[47.843634,35.130748],[47.843544,35.130637],[47.843528,35.130666],[47.8435,35.130716],[47.843461,35.130787],[47.841656,35.134007],[47.841568,35.134163],[47.841526,35.134237],[47.84149,35.134303],[47.840693,35.135754],[47.840479,35.136145],[47.839849,35.137353],[47.839721,35.137598],[47.839589,35.137849],[47.839484,35.138046],[47.839104,35.138743],[47.83907,35.138804],[47.838532,35.13979],[47.838302,35.140179],[47.837961,35.14081],[47.837938,35.140849],[47.837916,35.140889],[47.836732,35.143056],[47.836106,35.144178],[47.835994,35.14438],[47.835904,35.144542],[47.835846,35.144473],[47.835652,35.144241],[47.835535,35.144477],[47.835516,35.144515],[47.835433,35.144681],[47.835341,35.144864],[47.835301,35.144951],[47.835227,35.1451],[47.834971,35.145621],[47.834915,35.145736],[47.834412,35.146744],[47.834124,35.147319],[47.8335,35.146543],[47.832861,35.145794],[47.832701,35.145589],[47.832619,35.145766],[47.832559,35.145901],[47.831583,35.148026],[47.831077,35.149168],[47.830999,35.149342],[47.830804,35.149771],[47.830786,35.149809]],[[47.847109,35.120131],[47.847049,35.120241],[47.847012,35.120311],[47.84773,35.121167],[47.848202,35.12173],[47.848317,35.121867],[47.847553,35.123298],[47.847515,35.123367],[47.846659,35.124927],[47.846231,35.125707],[47.84527,35.127458],[47.845182,35.127618],[47.844992,35.127965],[47.844789,35.128335],[47.844596,35.128685],[47.844485,35.128889],[47.843592,35.130551],[47.843544,35.130637],[47.843528,35.130666],[47.8435,35.130716],[47.843461,35.130787],[47.841656,35.134007],[47.841568,35.134163],[47.841526,35.134237],[47.84149,35.134303],[47.840693,35.135754],[47.840479,35.136145],[47.839849,35.137353],[47.839721,35.137598],[47.839589,35.137849],[47.839484,35.138046],[47.839104,35.138743],[47.83907,35.138804],[47.838532,35.13979],[47.838302,35.140179],[47.837961,35.14081],[47.837938,35.140849],[47.837916,35.140889],[47.836732,35.143056],[47.836106,35.144178],[47.835994,35.14438],[47.835904,35.144542],[47.835846,35.144473],[47.835652,35.144241],[47.835535,35.144477],[47.835516,35.144515],[47.835433,35.144681],[47.835341,35.144864],[47.835301,35.144951],[47.835227,35.1451],[47.834971,35.145621],[47.834915,35.145736],[47.834412,35.146744],[47.834124,35.147319],[47.8335,35.146543],[47.832861,35.145794],[47.832701,35.145589],[47.83266,35.145547],[47.832641,35.145526],[47.832506,35.145382],[47.832484,35.145355],[47.831877,35.144621],[47.831777,35.1445],[47.831739,35.144454],[47.831285,35.14393],[47.83111,35.143729],[47.83071,35.143253],[47.830368,35.142876],[47.830152,35.142603],[47.830101,35.142539],[47.829869,35.142175],[47.829833,35.142118],[47.8297,35.141861],[47.829582,35.141609],[47.829465,35.141319],[47.829287,35.140749],[47.829226,35.140487],[47.829189,35.140324],[47.829149,35.140152],[47.829063,35.139534],[47.829044,35.13897],[47.829039,35.138611],[47.829049,35.138275],[47.829122,35.137653],[47.829247,35.13705],[47.829422,35.136476],[47.829561,35.136121],[47.829768,35.135704],[47.8299,35.13547],[47.829961,35.135363],[47.830021,35.13543],[47.830197,35.135614],[47.830276,35.135696],[47.830645,35.135102],[47.830885,35.134657],[47.831068,35.134873]],[[47.832071,35.154992],[47.832086,35.155269],[47.831905,35.155783],[47.831792,35.15605],[47.831751,35.156104],[47.831499,35.155803],[47.831271,35.155519],[47.83125,35.155463],[47.831226,35.155349],[47.831216,35.15525],[47.831211,35.15507],[47.831404,35.154247],[47.831678,35.153406],[47.832536,35.151615],[47.8327,35.151288],[47.834265,35.148148],[47.834588,35.147497],[47.835859,35.144945],[47.835954,35.144761],[47.836007,35.144656],[47.83609,35.144495],[47.836208,35.144266],[47.836833,35.143174],[47.838002,35.140998],[47.838019,35.14096],[47.838043,35.140919],[47.838122,35.140757],[47.838387,35.140288],[47.839232,35.138717],[47.839296,35.138583],[47.839426,35.138352],[47.839545,35.138126],[47.840788,35.135888],[47.841578,35.134421],[47.841617,35.13435],[47.841661,35.134271],[47.843547,35.130902],[47.843591,35.130824],[47.84362,35.130773],[47.843634,35.130748],[47.843687,35.130656],[47.84406,35.129971],[47.844583,35.12901],[47.844694,35.12881],[47.844888,35.128447],[47.845092,35.128091],[47.844992,35.127965],[47.84489,35.127835],[47.844597,35.127494],[47.844555,35.127445],[47.844436,35.127306],[47.843565,35.126287],[47.84359,35.126242],[47.843772,35.125904],[47.843619,35.125726],[47.844022,35.125028]],[[47.836214,35.159834],[47.835871,35.158856],[47.834633,35.159145],[47.83403,35.15933],[47.833432,35.159548],[47.833356,35.159607],[47.833196,35.15853],[47.833167,35.158227],[47.83315,35.158071],[47.833169,35.157877],[47.832994,35.157693],[47.832888,35.157551],[47.832832,35.157494],[47.832447,35.156987],[47.832292,35.156803],[47.832183,35.156635],[47.832028,35.156434],[47.831867,35.156267],[47.83182,35.1562],[47.831808,35.156183],[47.831751,35.156104],[47.831499,35.155803],[47.831271,35.155519],[47.83125,35.155463],[47.831226,35.155349],[47.831216,35.15525],[47.831211,35.15507],[47.831404,35.154247],[47.831678,35.153406],[47.832536,35.151615],[47.8327,35.151288],[47.834265,35.148148],[47.834588,35.147497],[47.835859,35.144945],[47.835954,35.144761],[47.836007,35.144656],[47.83609,35.144495],[47.836208,35.144266],[47.836833,35.143174],[47.838002,35.140998],[47.838019,35.14096],[47.838043,35.140919],[47.838122,35.140757],[47.838387,35.140288],[47.839232,35.138717],[47.839296,35.138583],[47.839426,35.138352],[47.839545,35.138126],[47.840788,35.135888],[47.841578,35.134421],[47.841617,35.13435],[47.841661,35.134271],[47.843547,35.130902],[47.843923,35.131358],[47.8447,35.132306],[47.845237,35.132951],[47.845316,35.133046],[47.845366,35.132969],[47.845383,35.132934],[47.845399,35.132901],[47.845573,35.13258],[47.845651,35.132436],[47.846177,35.131443],[47.846421,35.131014],[47.846502,35.130853],[47.846755,35.1304],[47.847009,35.12993],[47.847085,35.12979],[47.847556,35.128919],[47.848028,35.12805],[47.848068,35.127974],[47.848087,35.12794],[47.848129,35.127863],[47.848409,35.127344],[47.848602,35.126986],[47.848979,35.126282],[47.84909,35.126074],[47.849134,35.125994],[47.849395,35.125514],[47.848659,35.124635],[47.848315,35.124225],[47.84825,35.124147],[47.84805,35.123908]],[[47.834598,35.109737],[47.834723,35.109313],[47.835091,35.108155],[47.835246,35.107681],[47.835486,35.106951],[47.835491,35.106813],[47.835462,35.106796],[47.835388,35.106905],[47.835313,35.107115],[47.835177,35.107494],[47.834241,35.110524],[47.834184,35.110721],[47.833601,35.112804],[47.833457,35.113312],[47.83342,35.113442],[47.83337,35.113616],[47.833267,35.114009],[47.83323,35.114139],[47.833171,35.114347],[47.83301,35.114933],[47.832454,35.116954],[47.832296,35.117519],[47.83122,35.121505],[47.831004,35.122238],[47.830519,35.123982],[47.830479,35.124148],[47.830359,35.124551],[47.830017,35.125737],[47.829717,35.126842],[47.829675,35.127029],[47.829538,35.127525],[47.829325,35.128297],[47.829178,35.128181],[47.82862,35.127568],[47.828442,35.12739],[47.828372,35.127404]],[[47.845954,35.150069],[47.845784,35.149817],[47.845007,35.149919],[47.844431,35.149952],[47.843996,35.149976],[47.842791,35.150045],[47.842132,35.150079],[47.841636,35.150084],[47.84045,35.150171],[47.840297,35.150179],[47.839255,35.150236],[47.838777,35.150262],[47.8384,35.150278],[47.837662,35.150286],[47.837263,35.150192],[47.83699,35.150102],[47.836734,35.149981],[47.836368,35.149793],[47.836056,35.149568],[47.835944,35.14945],[47.83575,35.149245],[47.835726,35.149219],[47.83543,35.148865],[47.834732,35.148015],[47.83455,35.147807],[47.834298,35.147519],[47.834124,35.147319],[47.834412,35.146744],[47.834915,35.145736],[47.834971,35.145621],[47.835227,35.1451],[47.835301,35.144951],[47.835341,35.144864],[47.835433,35.144681],[47.835516,35.144515],[47.835535,35.144477],[47.835652,35.144241],[47.835596,35.144174],[47.83504,35.143514],[47.834406,35.142684],[47.83436,35.142556],[47.834369,35.142434],[47.834547,35.14116],[47.834666,35.14043],[47.834794,35.139622],[47.834819,35.139433],[47.834898,35.138798],[47.834912,35.138611],[47.834919,35.138522],[47.835006,35.138109],[47.83522,35.137486],[47.835414,35.136944],[47.835551,35.13665],[47.836158,35.13553],[47.836257,35.135359],[47.836479,35.135025],[47.836508,35.134937],[47.83653,35.134879],[47.836598,35.134693],[47.836706,35.134478],[47.837302,35.133439],[47.837369,35.133322],[47.837519,35.133039],[47.837536,35.133006],[47.838005,35.132122],[47.838058,35.132023],[47.837296,35.131226],[47.837547,35.130672],[47.837797,35.130929],[47.837969,35.130548],[47.837808,35.130356]]];

type StoryPhase = 'idle' | 'locating' | 'negotiating' | 'confirmed';

interface FleetVehicle {
  id: number;
  path: [number, number][];
  currentIdx: number;
  progress: number;
  speed: number;
  lat: number;
  lng: number;
}

interface HeroState {
  path: [number, number][];
  idx: number;
  progress: number;
}

const MapController = ({ phase, target, farm }: { phase: StoryPhase, target: [number, number] | null, farm: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        if (!target) {
            if (phase === 'idle') map.flyTo(ZP_CENTER, 13, { duration: 1.5 });
            return;
        }
        if (phase === 'locating') {
            map.flyTo(target, 15, { duration: 2 });
        } else if (phase === 'negotiating') {
            const bounds = L.latLngBounds([farm, target]);
            map.flyToBounds(bounds, { padding: [80, 80], duration: 2 });
        }
    }, [phase, target, map, farm]);
    return null;
};

export const A2AVision: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [turns, setTurns] = useState<any[]>([]);
  const [finalDelivery, setFinalDelivery] = useState<any>(null);
  
  // Story and Animation state
  const [storyPhase, setStoryPhase] = useState<StoryPhase>('idle');
  const [activeTarget, setActiveTarget] = useState<[number, number] | null>(null);
  const [fleet, setFleet] = useState<FleetVehicle[]>([]);
  const [heroState, setHeroState] = useState<HeroState | null>(null);
  const [heroRoute, setHeroRoute] = useState<[number, number][]>([]);
  const requestRef = useRef<number>();

  // Fetch realistic route using OSRM when target is acquired
  useEffect(() => {
      if (activeTarget && storyPhase === 'locating') {
          const fetchRoute = async () => {
              try {
                  const start = `${FARM_LOCATION[1]},${FARM_LOCATION[0]}`;
                  const end = `${activeTarget[1]},${activeTarget[0]}`;
                  const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`);
                  const data = await res.json();
                  if (data.routes && data.routes[0]) {
                      const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
                      setHeroRoute(coords);
                  } else {
                      throw new Error("No route found");
                  }
              } catch (e) {
                  console.error("OSRM Routing failed, falling back to straight lines", e);
                  setHeroRoute([FARM_LOCATION, [47.8480, 35.1280], [47.8440, 35.1340], activeTarget]);
              }
          };
          fetchRoute();
      }
  }, [activeTarget, storyPhase]);

  // Spawn hero vehicle once negotiation is confirmed
  useEffect(() => {
      if (storyPhase === 'confirmed' && heroRoute.length > 0) {
          setHeroState({
              path: heroRoute,
              idx: 0,
              progress: 0
          });
      }
  }, [storyPhase, heroRoute]);
  
  // Initialize fleet on routes
  useEffect(() => {
    const initialFleet: FleetVehicle[] = [];
    for (let i = 0; i < 8; i++) {
      const route = ZP_ROUTES[i % ZP_ROUTES.length];
      const path = Math.random() > 0.5 ? [...route].reverse() : [...route];
      const currentIdx = Math.floor(Math.random() * (path.length - 1));
      initialFleet.push({
        id: i,
        path,
        currentIdx,
        progress: Math.random(),
        speed: 0.001 + Math.random() * 0.0015, // Smooth driving speed
        lat: path[0][0], 
        lng: path[0][1],
      });
    }
    setFleet(initialFleet);
  }, []);

  // Fleet animation loop
  const animateFleet = () => {
    setFleet((prevFleet) => {
      return prevFleet.map((v) => {
        let { path, currentIdx, progress, speed } = v;
        progress += speed;
        
        if (progress >= 1) {
            progress = 0;
            currentIdx++;
            // Reverse direction at the end of a street
            if (currentIdx >= path.length - 1) {
                path = [...path].reverse();
                currentIdx = 0;
            }
        }
        
        const p1 = path[currentIdx];
        const p2 = path[currentIdx + 1];
        
        return { 
            ...v, 
            path, 
            currentIdx, 
            progress, 
            lat: p1[0] + (p2[0] - p1[0]) * progress, 
            lng: p1[1] + (p2[1] - p1[1]) * progress 
        };
      });
    });
    
    // Animate hero if exists
    setHeroState((prev) => {
      if (!prev) return prev;
      let { path, idx, progress } = prev;
      if (idx >= path.length - 1) return prev; // Reached destination
      
      const p1 = path[idx];
      const p2 = path[idx + 1];
      const dist = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
      
      // Normalize speed across uneven GPS segment lengths
      const step = Math.min(0.00015 / (dist + 0.00001), 1.0);
      progress += step;
      
      if (progress >= 1) {
          progress = 0;
          idx++;
      }
      return { path, idx, progress };
    });

    if (requestRef.current !== undefined) {
      requestRef.current = requestAnimationFrame(animateFleet);
    }
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animateFleet);
    return () => {
       if (requestRef.current !== undefined) {
           cancelAnimationFrame(requestRef.current);
       }
    };
  }, [finalDelivery]);

  let heroPos: [number, number] | null = null;
  if (heroState) {
      if (heroState.idx >= heroState.path.length - 1) {
          heroPos = heroState.path[heroState.path.length - 1];
      } else {
          const p1 = heroState.path[heroState.idx];
          const p2 = heroState.path[heroState.idx + 1];
          heroPos = [
              p1[0] + (p2[0] - p1[0]) * heroState.progress,
              p1[1] + (p2[1] - p1[1]) * heroState.progress
          ];
      }
  }

  const handleSimulate = async () => {
    setIsRunning(true);
    setTurns([]);
    setFinalDelivery(null);
    setHeroState(null);
    setActiveTarget(null);
    setHeroRoute([]);
    setStoryPhase('idle');

    try {
      const res = await fetch('/api/a2a/simulate', { method: 'POST' });
      if (!res.body) throw new Error("ReadableStream not yet supported in this browser.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      
      let turnCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last partial line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const data = JSON.parse(line);
                
                if (data.type === 'turn') {
                    setTurns(prev => [...prev, data.turn]);
                    turnCount++;
                    
                    // Cinematic Map Sync Logic
                    if (turnCount === 1) {
                         // First turn is the human request. Map targets coords.
                         setActiveTarget([47.8388, 35.1396]);
                         setStoryPhase('locating');
                    } else if (turnCount === 2) {
                         // Second turn is storefront replying. Map pans out.
                         setStoryPhase('negotiating');
                    }
                } else if (data.type === 'final') {
                    setFinalDelivery(data.delivery);
                    setStoryPhase('confirmed');
                    setIsRunning(false);
                }
            } catch (e) {
                console.error("Error parsing NDJSON chunk:", e);
            }
        }
      }
    } catch (err) {
      console.error(err);
      setIsRunning(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-brand-kraft text-brand-roasted font-sans">
      {/* Left Panel: The Negotiation */}
      <div className="w-1/3 flex flex-col bg-white border-r border-brand-border p-6 overflow-hidden shadow-[4px_0_24px_rgba(92,74,66,0.05)] z-10 relative">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDEiLz4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIwLjAyIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')]"></div>

        <div className="flex justify-between items-center mb-6 relative z-10 border-b border-brand-border/60 pb-4">
            <h1 className="text-xl font-bold font-serif text-brand-roasted tracking-tight">A2A Negotiation Log</h1>
            <button 
                onClick={handleSimulate}
                disabled={isRunning}
                className="flex items-center space-x-2 bg-brand-green hover:bg-brand-green/90 text-white px-4 py-2.5 rounded-full disabled:opacity-50 text-sm font-semibold transition-all shadow-sm"
            >
                {isRunning ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>{isRunning ? 'Negotiating...' : 'Trigger Simulation'}</span>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar relative z-10">
            {turns.length === 0 && !isRunning && (
                <div className="text-brand-roasted/50 font-medium italic text-sm text-center mt-10">Awaiting simulation trigger...</div>
            )}
            
            {turns.map((t, idx) => {
                if (!t || !t.speaker) return null;
                return (
                <div key={idx} className={`p-4 rounded-2xl border shadow-sm transition-all ${
                    t.speaker === 'Consumer Agent' 
                    ? 'bg-brand-roasted text-white border-brand-roasted/80 rounded-tl-sm ml-4' 
                    : t.speaker === 'Ivan Z. (Human User)'
                    ? 'bg-brand-kraftDark text-brand-roasted border-brand-border/60 mx-2 text-center shadow-inner'
                    : 'bg-white text-gray-900 border-brand-border/80 rounded-tr-sm mr-4'
                }`}>
                    <div className={`text-[11px] font-bold tracking-wider uppercase mb-1.5 ${t.speaker === 'Consumer Agent' ? 'opacity-80' : 'text-brand-roasted'}`}>
                        {t.speaker}
                    </div>
                    
                    {t.tools_used && t.tools_used.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3 justify-center sm:justify-start">
                            {t.tools_used.map((tool: string, i: number) => (
                                <span key={i} className={`px-2 py-1 rounded-md text-[10px] font-mono font-medium border ${
                                    t.speaker === 'Consumer Agent' ? 'bg-brand-roasted border-white/20 text-white/90' : 'bg-white border-brand-border text-brand-green'
                                }`}>
                                    ƒ {tool}()
                                </span>
                            ))}
                        </div>
                    )}
                    
                    <div className={`text-sm leading-relaxed whitespace-pre-wrap ${t.speaker === 'Ivan Z. (Human User)' ? 'italic font-medium' : ''}`}>
                        {t.message}
                    </div>
                </div>
                );
            })}
            
            {finalDelivery && Object.keys(finalDelivery).length > 0 && (
                <div className="p-5 bg-brand-green/5 border border-brand-green/20 rounded-2xl mt-6 shadow-sm mx-4">
                    <div className="text-brand-green font-bold text-xs mb-2 uppercase tracking-wide flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                        <span>Negotiation Concluded</span>
                    </div>
                    <div className="text-sm font-medium text-brand-roasted/80 mb-1">Order ID: {finalDelivery.order_id}</div>
                    <div className="text-sm font-medium text-brand-roasted/80 mb-1">Delivery ID: {finalDelivery.delivery_id}</div>
                    <div className="text-xs font-mono text-brand-roasted/60 mt-3 pt-3 border-t border-brand-green/10">Target: {finalDelivery.target_lat}, {finalDelivery.target_lon}</div>
                </div>
            )}
        </div>
      </div>

      {/* Right Panel: The Map */}
      <div className="w-2/3 relative bg-brand-kraftDark">
        <MapContainer 
            center={ZP_CENTER} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
        >
            <MapController phase={storyPhase} target={activeTarget} farm={FARM_LOCATION} />
            <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_3zac_1_ec5384d16e3632fde17fe81e"
            />
            
            {/* Background Fleet */}
            {fleet.map((v) => (
                <Marker key={v.id} position={[v.lat, v.lng]} icon={defaultVehicleIcon} />
            ))}
            
            {/* Logistics Route rendering based on phase */}
            {activeTarget && (storyPhase === 'negotiating' || storyPhase === 'confirmed') && (
                <Polyline 
                    positions={heroRoute} 
                    pathOptions={{ 
                        color: storyPhase === 'confirmed' ? '#D9735A' : '#5C4A42', 
                        dashArray: storyPhase === 'negotiating' ? '5, 10' : undefined,
                        weight: storyPhase === 'confirmed' ? 4 : 3,
                        opacity: storyPhase === 'confirmed' ? 0.8 : 0.4
                    }} 
                />
            )}

            {/* Target Marker */}
            {activeTarget && (
               <Marker 
                    position={activeTarget} 
                    icon={storyPhase === 'confirmed' ? createPulseIcon('#D9735A') : createPulseIcon('#f59e0b')}
               >
                    <Popup className="font-sans text-xs">
                        <strong>Target Destination</strong>
                        {finalDelivery && <><br/>Order ID: {finalDelivery.order_id}</>}
                    </Popup>
               </Marker>
            )}

            {/* Farm Marker (only show when zooming out to negotiate) */}
            {storyPhase !== 'idle' && (
                <Marker position={FARM_LOCATION} icon={defaultVehicleIcon}>
                    <Popup className="font-sans text-xs"><strong>Kozatska Ferma</strong><br/>Fulfillment Center</Popup>
                </Marker>
            )}

            {/* Hero Vehicle */}
            {heroPos && (
                <Marker position={heroPos} icon={heroVehicleIcon} />
            )}
        </MapContainer>
        
        {/* Overlay HUD */}
        <div className="absolute top-6 right-6 z-[1000] bg-white/90 backdrop-blur-md border border-brand-border p-5 rounded-2xl shadow-lg pointer-events-none min-w-[200px]">
            <h2 className="text-brand-roasted font-serif font-bold tracking-tight text-lg mb-3">Zaporizhzhia Fleet Control</h2>
            
            {storyPhase === 'locating' && (
                 <div className="text-sm font-bold text-yellow-600 mb-3 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse"></span>
                    <span>TARGET ACQUIRED</span>
                </div>
            )}
            
            {storyPhase === 'negotiating' && (
                 <div className="text-sm font-bold text-brand-roasted mb-3 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-roasted animate-pulse"></span>
                    <span>CALCULATING LOGISTICS</span>
                </div>
            )}
            
            {storyPhase === 'confirmed' && (
               <div className="text-sm font-bold text-white mb-3 flex items-center justify-center space-x-2 bg-brand-terracotta px-4 py-2.5 rounded-lg shadow-md border border-brand-terracotta/80 cursor-default">
                    <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] inline-block animate-pulse"></span>
                    <span>PRIORITY DISPATCHED</span>
                </div>
            )}

            <div className="text-sm font-medium text-brand-roasted/70 mb-2">Active Vehicles: {fleet.length}</div>
            <div className="text-sm font-medium text-brand-roasted/70 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-roasted inline-block"></span>
                <span>Standard Deliveries</span>
            </div>
        </div>
      </div>
    </div>
  );
};
