const BASE_URL = 'https://localhost:8082/areteios/wp-json/wp/v2';

export async function fetchPosts() {
    try {
        const response = await fetch(`${BASE_URL}/posts`);
        return await response.json();
    } catch (error) {
        return console.error('Error fetching posts:', error);
    }
}

export async function fetchTags() {
    try {
        const response = await fetch(`${BASE_URL}/tags`);
        return await response.json();
    } catch (error) {
        return console.error('Error fetching tags:', error);
    }
}