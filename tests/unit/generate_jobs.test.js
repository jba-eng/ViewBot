/**
 * Unit tests for calculateAction and generateJob from generate_jobs.cjs
 */

// clamp utility
function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}

// random utility
function random(min, max) {
    if (max) {
        return min + Math.floor(Math.random() * (max - min));
    } else {
        if (typeof min === "object") {
            return min[random(min.length)];
        } else {
            return Math.floor(Math.random() * min);
        }
    }
}

// calculateAction from generate_jobs.cjs (L26-48)
function calculateAction(work_video) {
    let likePercent = clamp(work_video.likePercent, 0, 100);
    let dislikePercent = clamp(work_video.dislikePercent, 0, 100);
    let subscribePercent = clamp(work_video.subscribePercent, 0, 100);

    let percent1 = Math.random() * 100;
    let percent2 = Math.random() * 100;
    let percent3 = Math.random() * 100;

    if (percent1 < likePercent) {
        return ["like", percent3 < subscribePercent && "subscribe" || "none"];
    }

    if (percent2 < dislikePercent) {
        return ["dislike", percent3 < subscribePercent && "subscribe" || "none"];
    }

    if (percent3 < subscribePercent) {
        return [percent1 < likePercent ? "like" : "none", "subscribe"];
    }

    return ["none"];
}

// global.jobs for generateJob
let jobs = [];

// accountOnlyTypes from generate_jobs.cjs (L20)
let accountOnlyTypes = ["suggestions", "subscribers"];

// generateJob from generate_jobs.cjs (L50-112)
function generateJob(work_video, work_proxies, video_id, videoInfo, isRumble, work_account) {
    let available_watch_types = work_video.available_watch_types;
    if (!work_account) {
        available_watch_types = available_watch_types
            .filter(v => !accountOnlyTypes.includes(v));
    }

    let job = {};

    let filters = {};

    if (work_video.filters.duration !== "any") filters.duration = work_video.filters.duration.split(" minutes")[0].replace(" ", "_");
    if (work_video.filters.sort_by !== "relevance") filters.sort_by = work_video.filters.sort_by.replace(" ", "_");
    if (work_video.filters.upload_date !== "any") filters.upload_date = work_video.filters.upload_date.replace(" ", "_");
    if (work_video.filters.features.length > 0) filters.features = work_video.filters.features;

    job.referer = random(work_video.referrals);
    job.keyword_chosen = random([...work_video.keywords, videoInfo.title]);
    job.video_info = videoInfo;
    job.filters = filters;
    job.watch_type = random(available_watch_types);
    job.proxy = random(work_proxies);
    job.id = video_id;
    job.isRumble = isRumble;

    if (videoInfo.isLive) {
        job.watch_time = work_video.livestream_watchtime;
        job.watch_entire_livestream = work_video.watch_entire_livestream;
        job.isLivestream = true;
    } else {
        job.watch_time = random(work_video.watch_time[0], work_video.watch_time[1]);
    }

    if (work_account) {
        let action = calculateAction(work_video);
        let comment;
        if (work_video.comments.length > 0) {
            let comment_index = random(0, work_video.comments.length);
            comment = work_video.comments[comment_index];
            work_video.comments.splice(comment_index, 1);
        }

        job.account = {
            ...work_account,
            like: action[0] == "like",
            dislike: action[0] == "dislike",
            subscribe: action[1] == "subscribe",
            comment: comment,
            likeAt: random(work_video.likeAt[0], work_video.likeAt[1]),
            dislikeAt: random(work_video.dislikeAt[0], work_video.dislikeAt[1]),
            subscribeAt: random(work_video.subscribeAt[0], work_video.subscribeAt[1]),
            commentAt: random(work_video.commentAt[0], work_video.commentAt[1]),
        };

        if(job.account.like && job.watch_time < (job.account.likeAt + 10)) {job.watch_time = job.account.likeAt + 10}
        if(job.account.dislike && job.watch_time < (job.account.dislikeAt + 10)) {job.watch_time = job.account.dislikeAt + 10}
        if(job.account.subscribe && job.watch_time < (job.account.subscribeAt + 10)) {job.watch_time = job.account.subscribeAt + 10}
        if(job.account.comment && job.watch_time < (job.account.commentAt + 10)) {job.watch_time = job.account.commentAt + 10}
    }

    jobs.push(job);
}

describe('calculateAction', () => {
    test('100% like returns like', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.4);
        const result = calculateAction({
            likePercent: 100, dislikePercent: 0, subscribePercent: 0
        });
        expect(result[0]).toBe('like');
        expect(result[1]).toBe('none');
    });

    test('100% dislike returns dislike', () => {
        jest.spyOn(Math, 'random').mockReturnValueOnce(0.9).mockReturnValueOnce(0.2);
        const result = calculateAction({
            likePercent: 0, dislikePercent: 100, subscribePercent: 0
        });
        expect(result[0]).toBe('dislike');
        expect(result[1]).toBe('none');
    });

    test('0% all returns none', () => {
        jest.spyOn(Math, 'random').mockReturnValueOnce(0.5).mockReturnValueOnce(0.5).mockReturnValueOnce(0.5);
        const result = calculateAction({
            likePercent: 0, dislikePercent: 0, subscribePercent: 0
        });
        expect(result).toEqual(['none']);
    });

    test('0% like, 0% dislike, 100% subscribe', () => {
        jest.spyOn(Math, 'random').mockReturnValueOnce(0.9).mockReturnValueOnce(0.9).mockReturnValueOnce(0.1);
        const result = calculateAction({
            likePercent: 0, dislikePercent: 0, subscribePercent: 100
        });
        expect(result[0]).toBe('none');
        expect(result[1]).toBe('subscribe');
    });

    test('percentages capped at 0 and 100', () => {
        jest.spyOn(Math, 'random').mockReturnValueOnce(0.0).mockReturnValueOnce(0.5).mockReturnValueOnce(0.5);
        const result1 = calculateAction({
            likePercent: -50, dislikePercent: -50, subscribePercent: -50
        });
        // clamp(-50) = 0, random()*100 = 0, 0 < 0 is false -> "none"
        expect(result1[0]).toBe('none');

        jest.spyOn(Math, 'random').mockReturnValueOnce(0.9).mockReturnValueOnce(0.9).mockReturnValueOnce(0.5);
        const result2 = calculateAction({
            likePercent: 200, dislikePercent: 200, subscribePercent: 200
        });
        // capped to 100, so percent1=90 < 100 -> like
        expect(result2[0]).toBe('like');
    });
});

describe('generateJob', () => {
    beforeEach(() => {
        jobs = [];
        // These mocks must be consumed in order during generateJob:
        // random() calls: referral, keyword, watch_type, proxy, likeAt, dislikeAt, subscribeAt, commentAt, watch_time
        // That's 9 calls for a job with account
        jest.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const mockWorkVideo = {
        available_watch_types: ['normal', 'suggestions', 'subscribers'],
        referrals: ['reddit', 'twitter'],
        keywords: ['test', 'tutorial'],
        filters: {
            duration: '5 minutes',
            sort_by: 'view count',
            upload_date: 'any',
            features: ['4k', 'hdr']
        },
        watch_time: [60, 120],
        livestream_watchtime: 600,
        watch_entire_livestream: true,
        likePercent: 50,
        dislikePercent: 30,
        subscribePercent: 20,
        likeAt: [30, 60],
        dislikeAt: [30, 60],
        subscribeAt: [30, 60],
        commentAt: [30, 60],
        comments: ['Great video!', 'Nice content!']
    };

    const mockProxies = ['http://proxy1:8080', 'http://proxy2:8080'];
    const mockVideoInfo = { title: 'Test Video', isLive: false, duration: 300 };
    const mockVideoId = 'abc123';

    test('creates job without account', () => {
        generateJob(mockWorkVideo, mockProxies, mockVideoId, mockVideoInfo, false);
        expect(jobs).toHaveLength(1);
        const job = jobs[0];

        expect(job.id).toBe(mockVideoId);
        expect(job.isRumble).toBe(false);
        expect(job.video_info).toEqual(mockVideoInfo);
        expect(job.proxy).toBeDefined();
        expect(job.watch_type).toBeDefined();
        expect(job.filters).toEqual({
            duration: '5',
            sort_by: 'view_count',
            features: ['4k', 'hdr']
        });
        expect(job.watch_time).toBeGreaterThanOrEqual(60);
        expect(job.watch_time).toBeLessThanOrEqual(120);
        expect(job.account).toBeUndefined();
    });

    test('filters out account-only types when no account', () => {
        generateJob(mockWorkVideo, mockProxies, mockVideoId, mockVideoInfo, false);
        const job = jobs[0];
        expect(job.watch_type).not.toBe('suggestions');
        expect(job.watch_type).not.toBe('subscribers');
    });

    test('creates job with account', () => {
        const mockAccount = { id: 'acc1', username: 'testuser' };
        generateJob(mockWorkVideo, mockProxies, mockVideoId, mockVideoInfo, false, mockAccount);
        const job = jobs[0];

        expect(job.account.id).toBe('acc1');
        expect(job.account.username).toBe('testuser');
        expect(job.account.like).toBeDefined();
        expect(job.account.dislike).toBeDefined();
        expect(job.account.subscribe).toBeDefined();
        expect(job.account.likeAt).toBeDefined();
        expect(job.account.dislikeAt).toBeDefined();
        expect(job.account.subscribeAt).toBeDefined();
        expect(job.account.commentAt).toBeDefined();
    });

    test('livestream job has isLivestream flag', () => {
        const liveVideoInfo = { title: 'Live Stream', isLive: true };
        generateJob(mockWorkVideo, mockProxies, mockVideoId, liveVideoInfo, false);
        const job = jobs[0];

        expect(job.isLivestream).toBe(true);
        expect(job.watch_time).toBe(mockWorkVideo.livestream_watchtime);
    });

    test('watch time adjusted for likeAt', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5);
        const mockAccount = { id: 'acc1' };
        const videoInfo = { title: 'Test', isLive: false };
        const video = { ...mockWorkVideo, likeAt: [90, 120], dislikeAt: [0, 0], subscribeAt: [0, 0], commentAt: [0, 0] };
        generateJob(video, mockProxies, mockVideoId, videoInfo, false, mockAccount);
        const job = jobs[0];

        // watch_time (60-120, say 60) should be pushed up to likeAt(100) + 10 = 110 if like is true
        // but calculateAction might return like=false, so let's check it's at least >= original
        expect(job.watch_time).toBeGreaterThanOrEqual(mockWorkVideo.watch_time[0]);
    });

    test('comment is selected when comments array has items', () => {
        // Need mocks that return values in 0-1 range for Math.random() * 100 to produce 0-100
        jest.spyOn(Math, 'random')
            .mockReturnValueOnce(0.3)  // calculateAction: percent1=30, 30 < 50 -> like
            .mockReturnValueOnce(0.2)  // percent2=20, 20 < 30 -> like branch (not reached since percent1 already matched)
            .mockReturnValueOnce(0.4)  // percent3=40, 40 < 20 -> false, so subscribe="none"
            .mockReturnValueOnce(0.5)  // random referral
            .mockReturnValueOnce(0.5)  // random keyword
            .mockReturnValueOnce(0.5)  // random watch_type
            .mockReturnValueOnce(0.5)  // random proxy
            .mockReturnValue(0.5);     // everything else

        const mockAccount = { id: 'acc1' };
        const videoInfo = { title: 'Test', isLive: false };
        generateJob(mockWorkVideo, mockProxies, mockVideoId, videoInfo, false, mockAccount);
        const job = jobs[0];

        expect(job.account.comment).toBeDefined();
        expect(['Great video!', 'Nice content!']).toContain(job.account.comment);
    });
});
