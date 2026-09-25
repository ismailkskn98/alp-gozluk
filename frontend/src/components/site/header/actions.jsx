import AccountAction from './account-action';
import CartAction from './cart-action';
import FavoriteAction from './favorite-action';
import SearchMenu from './search';

export default function HeaderActions({ authenticated, locale, labels, navigationItems }) {
  return (
    <div className="col-start-3 row-start-1 flex items-center justify-self-end">
      <SearchMenu locale={locale} navigationItems={navigationItems} triggerLabel={labels.search} />
      <AccountAction authenticated={authenticated} locale={locale} label={labels.account} />
      <FavoriteAction authenticated={authenticated} label={labels.favorites} loginLabel={labels.loginToFavorites} />
      <CartAction locale={locale} label={labels.cart} />
    </div>
  );
}
