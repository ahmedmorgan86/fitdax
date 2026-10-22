export async function signOutLocal(db){
 const {error}=await db.auth.signOut({scope:'local'});
 if(error)throw error;
}
