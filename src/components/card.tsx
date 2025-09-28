type Props = {
  prop: string;
  value: any;
};

export default function Card({ prop, value }: Props) {
  return (
    <div className="card bg-base-200 w-96 shadow-sm m-2">
      <div className="card-body">
        <h2 className="card-title text-sm">
          <span className="text-base-content/60">{prop}:</span> {value}
        </h2>
        {/* <div className="card-actions justify-end">
          <button className="btn btn-primary">Buy Now</button>
        </div> */}
      </div>
    </div>
  );
}
