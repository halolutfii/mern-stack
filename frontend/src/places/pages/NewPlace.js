import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';

import './PlaceForm.css';
import Input from "../../shared/components/FormElements/Input";
import { VALIDATOR_MINLENGTH, VALIDATOR_REQUIRE } from "../../shared/util/Validators";
import Button from '../../shared/components/FormElements/Button';
import { useForm } from "../../shared/hooks/form-hooks";
import { useHttpClient } from '../../shared/hooks/http-hooks';
import { AuthContext } from "../../shared/context/auth-context";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import ImageUpload from '../../shared/components/FormElements/ImageUpload';

const NewPlace = () => {
    const auth = useContext(AuthContext);
    const {isLoading, error, sendRequest, clearError} = useHttpClient();
    const [formState, InputHandler] = useForm({
        title: {
            value: '',
            isValid: false
        },
        description: {
            value: '',
            isValid: false
        },
        address: {
            value: '',
            isValid: false
        },
        image: {
            value: '',
            isValid: false
        },
    }, false);

    const history = useHistory();

    const placeSubmitHandler = async event => {
        event.preventDefault();
        try {
            const formData = new FormData();
            formData.append('title', formState.inputs.title.value);
            formData.append('description', formState.inputs.description.value);
            formData.append('address', formState.inputs.address.value);
            formData.append('creator', auth.userId);
            formData.append('image', formState.inputs.image.value);
            await sendRequest(process.env.REACT_APP_BACKEND_URL + '/places', 'POST', formData, {
                Authorization: 'Bearer ' + auth.token
            });
            history.push('/');
        } catch (err) {}


        // console.log(formState.inputs); // send this to backend!
    };

    return (
        <React.Fragment>
            <ErrorModal error={error} onClear={clearError} />
            {isLoading && <LoadingSpinner asOverlay />}
            <form className="place-form" onSubmit={placeSubmitHandler}>
                <Input id="title" element="input" type="text" label="Title" validators={[VALIDATOR_REQUIRE()]} errorText="Please enter a valid title." onInput={InputHandler}/>
                <Input id="description" element="textarea" type="text" label="Description" validators={[VALIDATOR_MINLENGTH(5)]} errorText="Please enter a valid description (at least 5 characters)." onInput={InputHandler}/>
                <Input id="address" element="input" type="text" label="Address" validators={[VALIDATOR_REQUIRE()]} errorText="Please enter a valid address." onInput={InputHandler}/>
                <ImageUpload center id="image" onInput={InputHandler} errorText="Please provide an image." />
                <Button type="submit" disabled={!formState.isValid}>
                    ADD PLACE
                </Button>
            </form>      
        </React.Fragment>
    );
};

export default NewPlace;