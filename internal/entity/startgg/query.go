package startgg

const (
	GetUserBySlug = `
	query getUserBySlug($userSlug: String!) {
		user(slug: $userSlug) {
			id
			slug
			authorizations(types: [DISCORD]) {
				id
				type
				externalUsername
			}
			player {
				id
				gamerTag
			}
		}
	}
	`
	GetListPhaseGroups = `
	query getListPhaseGroups($slug: String, $states: [Int]) {
		event(slug: $slug) {
			id
			name
			phaseGroups {
				id
				sets (
					filters: {state: $states}
				){
					pageInfo{
						total
					}
				}
			}
		}
	}
	`
	GetTournament = `
	query getTournament($tourneySlug:String!) {
		tournament(slug: $tourneySlug) {
			id
			name
			state
		}
	}
	`
	GetPagesCount = `
	query getPagesCount($phaseGroupId: ID!, $states: [Int]){
		phaseGroup(id:$phaseGroupId){
			id
			sets (
				filters: {state: $states}
			){
				pageInfo{
					total
				}
			}
		}
	}
	`
	GetPhaseGroupState = `
	query getPhaseGroupState($phaseGroupId: ID!){
		phaseGroup(id:$phaseGroupId){
			id
			state
		}
	}
	`
	GetPhaseGroupSets = `
	query getSets($phaseGroupId: ID!, $page:Int!, $perPage:Int!, $states: [Int]){
		phaseGroup(id:$phaseGroupId){
			id
			sets(
				page: $page
				perPage: $perPage
				sortType: STANDARD
				filters: {state: $states}
			){
			pageInfo{
				total
			}
			nodes{
					id
					state
					stream {
						streamName
						streamSource
					}
					fullRoundText
        			round
					slots{
						entrant{
							id
							participants {
								gamerTag
								connectedAccounts
								user {
									id
									slug
									authorizations(types: DISCORD) {
										externalUsername
									}
								}
							}
						}
					}
				}
			}
		}
	}
	`
)
