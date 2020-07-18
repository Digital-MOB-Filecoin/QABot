
function FormatBytes(bytes, decimals = 2) {
    if (0 === bytes) return "0 Bytes";
    const c = 0 > decimals ? 0 : decimals;
    const d = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, d)).toFixed(c)) + " " + ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d];
}

function DealTimeout(timestamp) {
    var timeDifference = Math.abs(Date.now() - timestamp);

    if (timeDifference > 1000 * 3600 * 48) //48 hours
        return true;

    return false;
}

function TimeDifferenceInHours(timestamp) {
    return (Math.abs(Date.now() - timestamp) / (1000 * 3600)).toFixed();
}

function Timeout(seconds) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('timeout');
        }, seconds * 1000);
    });
}

module.exports = {
    FormatBytes,
    DealTimeout,
    TimeDifferenceInHours,
    Timeout,
};
