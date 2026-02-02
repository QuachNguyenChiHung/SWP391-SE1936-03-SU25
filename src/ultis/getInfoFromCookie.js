export default function getInforFromCookie() {
    try {
        const savedUser = document.cookie.split('; ').find(row => row.startsWith('user='));
        const userValue = decodeURIComponent(savedUser.split('=')[1]);
        //user={'token':'', 'user':{...}}
        //['user,{'token':'', 'user':{...}}]
        return JSON.parse(userValue);
    } catch (error) {
        return null;
    }
}