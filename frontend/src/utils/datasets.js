// Dataset names mapped to their CSV column headers
const DATASETS = {
    athletes: [
        'code', 'current', 'name', 'name_short', 'name_tv', 'gender', 'function',
        'country_code', 'country', 'country_long', 'nationality', 'nationality_long',
        'nationality_code', 'height', 'weight', 'disciplines', 'events', 'birth_date',
        'birth_place', 'birth_country', 'residence_place', 'residence_country',
        'nickname', 'hobbies', 'occupation', 'education', 'family', 'lang', 'coach',
        'reason', 'hero', 'influence', 'philosophy', 'sporting_relatives', 'ritual',
        'other_sports',
    ],
    coaches: [
        'code', 'current', 'name', 'gender', 'function', 'category', 'country_code',
        'country', 'country_long', 'disciplines', 'events', 'birth_date',
    ],
    events: ['event', 'tag', 'sport', 'sport_code', 'sport_url'],
    medallists: [
        'medal_date', 'medal_type', 'medal_code', 'name', 'gender', 'country_code',
        'country', 'country_long', 'nationality_code', 'nationality',
        'nationality_long', 'team', 'team_gender', 'discipline', 'event',
        'event_type', 'url_event', 'birth_date', 'code_athlete', 'code_team',
        'is_medallist',
    ],
    medals: [
        'medal_type', 'medal_code', 'medal_date', 'name', 'gender', 'discipline',
        'event', 'event_type', 'url_event', 'code', 'country_code', 'country',
        'country_long',
    ],
    medals_total: [
        'country_code', 'country', 'country_long', 'Gold Medal', 'Silver Medal',
        'Bronze Medal', 'Total',
    ],
    nocs: ['code', 'country', 'country_long', 'tag', 'note'],
    schedules: [
        'start_date', 'end_date', 'day', 'status', 'discipline', 'discipline_code',
        'event', 'event_medal', 'phase', 'gender', 'event_type', 'venue',
        'venue_code', 'location_description', 'location_code', 'url',
    ],
    schedules_preliminary: [
        'date_start_utc', 'date_end_utc', 'estimated', 'estimated_start',
        'start_text', 'medal', 'venue_code', 'description', 'venue_code_other',
        'discription_other', 'team_1_code', 'team_1', 'team_2_code', 'team_2',
        'tag', 'sport', 'sport_code', 'sport_url',
    ],
    teams: [
        'code', 'current', 'team', 'team_gender', 'country_code', 'country',
        'country_long', 'discipline', 'disciplines_code', 'events', 'athletes',
        'coaches', 'athletes_codes', 'num_athletes', 'coaches_codes', 'num_coaches',
    ],
    technical_officials: [
        'code', 'current', 'name', 'gender', 'function', 'category',
        'organisation_code', 'organisation', 'organisation_long', 'disciplines',
        'birth_date',
    ],
    torch_route: [
        'title', 'city', 'date_start', 'date_end', 'tag', 'url', 'stage_number',
    ],
    venues: ['venue', 'sports', 'date_start', 'date_end', 'tag', 'url'],
};

export default DATASETS;
