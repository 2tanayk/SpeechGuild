
def is_user_logged_in(request):
    is_logged_in=False
    if request.user.is_authenticated:
        is_logged_in=True

    return {'is_logged_in':is_logged_in}
