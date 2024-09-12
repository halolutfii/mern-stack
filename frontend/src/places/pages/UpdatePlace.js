import React, { useEffect, useState, useContext } from "react";
import { useParams, useHistory } from "react-router-dom";

import Input from "../../shared/components/FormElements/Input";
import Button from "../../shared/components/FormElements/Button";
import { VALIDATOR_MINLENGTH, VALIDATOR_REQUIRE } from "../../shared/util/Validators";
import { useForm } from "../../shared/hooks/form-hooks";
import Card from "../../shared/components/UIElements/Card";
import { useHttpClient } from "../../shared/hooks/http-hooks";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import { AuthContext } from "../../shared/context/auth-context";


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
//   ]; -- DUMMY PLACES

const UpdatePlace = () => {
    const auth = useContext(AuthContext);
    const { isLoading ,error, sendRequest, clearError } = useHttpClient();
    const [loadedPlace, setLoadedPlace] = useState();
    const placeId = useParams().placeId;

    const history = useHistory();

    const [formState, InputHandler, setFormData] = useForm({
      title: {
        value: '',
        isValid: false
      },
      description: {
        value: '',
        isValid: false
      }
    }, true);

    // const identifiedPlace = DUMMY_PLACES.find(p => p.id === placeId); -- DUMMY PLACES

    useEffect(() => {
      const fetchPlace = async () => {
        try {
          const responseData = await sendRequest(process.env.REACT_APP_BACKEND_URL  + `/places/${placeId}`);
          setLoadedPlace(responseData.place);
          setFormData({
            title: {
              value: responseData.place.title,
              isValid: true
            },
            description: {
              value: responseData.place.description,
              isValid: true
            }
          },
          true
        );
        } catch (err) {
          
        }
      };
      fetchPlace();
    }, [sendRequest, placeId, setFormData]);
    
    const placeUpdateSubmitHandler = async event => {
      event.preventDefault();

      try {
        await sendRequest(process.env.REACT_APP_BACKEND_URL + `/places/${placeId}`, 'PATCH', JSON.stringify({
          title: formState.inputs.title.value,
          description: formState.inputs.description.value,
        }), 
        {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + auth.token
        }
      );
      history.push('/' + auth.userId + '/places' );
      } catch (err) {
        
      }
      
      // console.log(formState.inputs); -- DUMMY POST UPDATE PLACE
    };

    if (isLoading) {
      return (
        <div className="center">
            <LoadingSpinner />
        </div>
        );
    }

    if (!loadedPlace && !error) {
        return (
        <div className="center">
          <Card>
            <h2>Could not find place!</h2>
          </Card>
        </div>
        );
    }

    
    return (
      <React.Fragment>
        <ErrorModal error={error} onClear={clearError}  />
        {!isLoading && loadedPlace && <form className="place-form" onSubmit={placeUpdateSubmitHandler}>
            <Input id="title" element="input" type="text" label="Title" validators={[VALIDATOR_REQUIRE()]} errorText="Please enter a valid title." onInput={InputHandler} initialValue={loadedPlace.title} initialValid={true}/>
            <Input id="description" element="textarea" type="text" label="Description" validators={[VALIDATOR_MINLENGTH(5)]} errorText="Please enter a valid description (min. 5 characters)." onInput={InputHandler} initialValue={loadedPlace.description} initialValid={true}/>
            <Button type="submit" disabled={!formState.isValid}>UPDATE</Button>
        </form>}
      </React.Fragment>
    );
};

export default UpdatePlace;