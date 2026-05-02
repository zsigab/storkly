package app.storkly.auth;

import app.storkly.domain.user.User;

interface StorklyUserHolder {
    User getStorklyUser();
}
