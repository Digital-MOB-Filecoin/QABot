
function DealTimeout(timestamp) {
    var timeDifference = Math.abs(Date.now() - timestamp);

    if (timeDifference > 1000 * 3600 * 48) //48 hours
        return true;

    return false;
}

function Timeout(seconds) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('timeout');
        }, seconds * 1000);
    });
}

module.exports = {
    Timeout,
    DealTimeout,
};