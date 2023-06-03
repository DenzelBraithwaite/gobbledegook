<script lang="ts">
    // Svelte hooks
    import { createEventDispatcher } from 'svelte';

    // Custom components
    import Button from '../lib/Button.svelte';

    
    const createEvent = createEventDispatcher();
    let formData = {
        username: 'dbraithwaite01',
        password: '',
    };
    
    const url = 'http://localhost/projects/gobbledegook_backend/api.php';
    async function formHandler() {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            const data = await response.json();
            
            // Sign user in if credentials match
            if (data.userValid === true) {
                createEvent('userLogin', {
                    username: data.username,
                    userLogged: true
                })

                // window.location.href = '/home';
            } else {
                console.log("nahh... I don't really know em like that");
            };
        } catch (error) {
            console.log(error);
        };

    };

</script>

<div class="form-container">
    <form on:submit|preventDefault={formHandler} action="http://localhost/projects/gobbledegook_backend/db.php">
        <h2 class="form-title">Sign into your account</h2>
        <div class="form-control">
            <label for="username">Username</label>
            <input type="text" placeholder="username" name="username" id="username" bind:value={formData['username']}>
        </div>
        <div class="form-control">
            <label for="password">Password</label>
            <input type="password" placeholder="password" name="password" id="password" bind:value={formData['password']}>
        </div>
        <Button btnSubmit={true} customClasses="w-100 btn__orange">Log in</Button>
    </form>
</div>

<style>
    form {
        position: relative;
        width: 40%;
        min-width: 350px;
        max-width: 450px;
        padding: 2rem;
        margin: 0 auto 5rem;
        background-color: #fffffff3;
        border-radius: 0.125rem;
        box-shadow: 0 3px 8px #00000057;
    }

    .form-control {
        width: 100%;
        margin-bottom: 2rem;
    }

    .form-title {
        font-weight: bold;
        font-size: 1rem;
    }

    form label {
        font-weight: bold;
        font-size: 0.75rem;
    }

    form input {
        display: block;
        width: 100%;
        background-color: #fff;
        border: 1px solid #7a7a7a;
        border-radius: 0.125rem;
        padding: 0.5rem 0.25rem;
    }
</style>