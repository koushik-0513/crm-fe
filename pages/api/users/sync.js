export default async function handler(req,res){
    if(req.method !== "POST") return res.status(405).end()

    try{
        const token = req.headers.authorisation?.split(" ")[i];

        const responce = await fetch(`${process.env.BACKEND_URL}/api/auth/verify-token`,{
            method:"POST",
            headers:{"content-type":"application/json"},
            body:JSON.stringify({token})
        });

        const result = await responce.json()

        if (!responce.ok) throw new Error(result.error || "Verification failed")

        return res.status(200).json({message: "user synced"});
    }catch{
        console.error("error:",errorToJSON.message)
        return res.status(500).json({error:"failed to sync"})
    }
}