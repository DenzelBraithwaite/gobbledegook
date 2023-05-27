<script lang="ts">
    import Button from '../lib/Button.svelte';

    let formData = {
        username: '',
        password: '',
    }

    function formHandler() {
        fetch("http://localhost/projects/gobbledegook_backend/api.php", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => console.log(JSON.stringify(formData)))
        // .then(data => console.log(data))
        // .catch(error => console.log(error));
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
        <Button btnSubmit={true} customClasses="btn btn__orange">Log in</Button>
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