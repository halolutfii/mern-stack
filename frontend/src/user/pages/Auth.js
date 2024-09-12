import React, { useState, useContext } from "react";

import './Auth.css';
import { VALIDATOR_EMAIL, VALIDATOR_MINLENGTH, VALIDATOR_REQUIRE } from "../../shared/util/Validators";
import { useForm } from "../../shared/hooks/form-hooks";
import { useHttpClient } from "../../shared/hooks/http-hooks";
import { AuthContext } from "../../shared/context/auth-context";
import Card from "../../shared/components/UIElements/Card";
import Input from "../../shared/components/FormElements/Input";
import Button from "../../shared/components/FormElements/Button";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner"; 
import ImageUpload from "../../shared/components/FormElements/ImageUpload";

const Auth = () => {
    const auth = useContext(AuthContext);
    const [isLoginMode, setIsLoginMode] = useState(true);
    const { isLoading, error, sendRequest, clearError } = useHttpClient(); //Ngambil request http-hooks

    const [formState, inputHandler, setFormData] = useForm({
        email: {
            value: '',
            isValid: false
        },
        password: {
            value: '',
            isValid: false
        }
    });

    const authSubmitHandler = async event => {
        event.preventDefault();

        if (isLoginMode) {
            try {
                // Connect to backend login
                const responseData = await sendRequest(process.env.REACT_APP_BACKEND_URL + '/users/login', 'POST',
                    JSON.stringify({
                        email: formState.inputs.email.value,
                        password: formState.inputs.password.value
                    }),
                    {
                        'Content-Type': 'application/json'
                    },
                );

                auth.login(responseData.userId, responseData.token);
            } catch (err) {}
        } else {
            try {
                const formData = new FormData();
                formData.append('name', formState.inputs.name.value);
                formData.append('email', formState.inputs.email.value);
                formData.append('password', formState.inputs.password.value);
                formData.append('image', formState.inputs.image.value)
                // Connect to backend singup
                const responseData =await sendRequest(process.env.REACT_APP_BACKEND_URL + '/users/singup', 'POST',
                    formData
                );

                auth.login(responseData.userId, responseData.token);
            } catch (err) {
            }
        }

        // console.log(formState.inputs); -- debug dummy data
    };

    const switchModeHandler = () => {
        if (!isLoginMode) {
            setFormData({
                ...formState.inputs,
                name: undefined,
                image: undefined
            }, formState.inputs.email.isValid && formState.inputs.password.isValid);
        } else {
            setFormData({
                ...formState.inputs,
                name: {
                    value: '',
                    isValid: false
                },
                image: {
                    value: null,
                    isValid: false
                }
            }, false);
        }
        setIsLoginMode(prevMode => !prevMode);
    };

    return (
        <React.Fragment>
            <ErrorModal error={error} onClear={clearError}/>
            <Card className="authentication">
                {isLoading && <LoadingSpinner asOverlay={true} />}
                <h2>Login Required</h2> 
                <hr />
                <form onSubmit={authSubmitHandler}>
                    {!isLoginMode && (<Input element="input" id="name" type="text" label="Your Name" validators={[VALIDATOR_REQUIRE()]} errorText="Please enter a name." onInput={inputHandler} />)}
                    {!isLoginMode && <ImageUpload center id="image" onInput={inputHandler} errorText="Please provide an image."/>}
                    <Input element="input" id="email" type="email" label="E-Mail" validators={[VALIDATOR_EMAIL()]} errorText="Please enter a valid email address." onInput={inputHandler} />
                    <Input element="input" id="password" type="password" label="Password" validators={[VALIDATOR_MINLENGTH(8)]} errorText="Please enter a valid password, at least 8 Characters." onInput={inputHandler} />
                    <Button type="submit" disabled={!formState.isValid}>{isLoginMode ? 'LOGIN' : 'SINGUP'}</Button>
                </form>
                <Button inverse onClick={switchModeHandler}>SWITCH TO {isLoginMode ? 'SINGUP' : 'LOGIN'}</Button>
            </Card>
        </React.Fragment>
    );
};

export default Auth;