package startgg

import (
	"github.com/dreamervulpi/tourney-helper/internal/entity/startgg"
)

func (c *Client) GetUserBySlug(userSlug string) (startgg.UserData, error) {
	var variables = map[string]any{
		"userSlug": userSlug,
	}

	results, err := GetData[startgg.RawUserData](c, startgg.GetUserBySlug, variables)
	if err != nil {
		return startgg.UserData{}, err
	}

	return results.Data, nil
}
