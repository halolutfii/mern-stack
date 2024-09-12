import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import PlaceList from "../components/PlaceList";
import { useHttpClient } from "../../shared/hooks/http-hooks";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";

// const DUMMY_PLACES = [
//     {
//       id: 'p1',
//       title: 'Empire State Building',
//       description: 'One of the most famous sky scrapers in the world!',
//       imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/NYC_Empire_State_Building.jpg/640px-NYC_Empire_State_Building.jpg',
//       address: '20 W 34th St, New York, NY 10001',
//       location: {
//         lat: 40.7484405,
//         lng: -73.9878584
//       },
//       creator: 'u1'
//     },
//     {
//       id: 'p2',
//       title: 'Emp. State Building',
//       description: 'One of the most famous sky scrapers in the world!',
//       imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/NYC_Empire_State_Building.jpg/640px-NYC_Empire_State_Building.jpg',
//       address: '20 W 34th St, New York, NY 10001',
//       location: {
//         lat: 40.7484405,
//         lng: -73.9878584
//       },
//       creator: 'u2'
//     }
//   ];


const UserPlaces = () => {
    const [loadedPlaces, setLoadedPlaces] = useState();
    const { isLoading, error, sendRequest, clearError  } = useHttpClient();

    const userId = useParams().userId;

    useEffect(() => {
        const fetchPlaces = async () => {
          try {
            const responseData = await sendRequest(process.env.REACT_APP_BACKEND_URL + `/places/user/${userId}`);

            setLoadedPlaces(responseData.places);
          } catch (err) {
            
          }
        };
        fetchPlaces();
    }, [sendRequest, userId]);

    // const loadedPlaces = DUMMY_PLACES.filter(place => place.creator === userId); -- FOR DUMMY PLACES

    const placeDeletedHandler = (deletedPlaceId) => {
      setLoadedPlaces(prevPlaces => prevPlaces.filter(place => place.id !== deletedPlaceId));
    }
    
    return ( 
      <React.Fragment>
        <ErrorModal error={error} onClear={clearError} />
        {isLoading && (
          <div className="center">
            <LoadingSpinner />
          </div>
          )}
          {!isLoading && loadedPlaces && <PlaceList items={loadedPlaces} onDelete={placeDeletedHandler} /> }
      </React.Fragment>
    );
};

export default UserPlaces;